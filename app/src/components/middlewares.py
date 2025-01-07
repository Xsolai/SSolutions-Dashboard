from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.database.auth.oauth2 import get_current_user
from app.database.models.models import User, Permission, BlacklistedToken
from app.database.db.db_connection import get_db
from starlette.middleware.base import BaseHTTPMiddleware
from app.src.logger import logging


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class RoleBasedAccessMiddleware(BaseHTTPMiddleware):
    EXCLUDED_PATHS = [
        "/auth/register", 
        "/auth/verify-otp",
        "/auth/resend-otp",
        "/login",
        "auth/verify-token",
        "/forget-password/",
        "/reset-password/",
        "/history"
    ]
    async def dispatch(self, request: Request, call_next):
        try:
            if request.method == "OPTIONS":  # Skip authorization for OPTIONS requests
                return await call_next(request)

            
            if request.url.path in self.EXCLUDED_PATHS:
                return await call_next(request)
            
            # Get the DB session
            db: Session = next(get_db())
            
            # Extract and validate the Authorization header
            authorization_header = request.headers.get("Authorization")
            if not authorization_header or not authorization_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
            
            token = authorization_header.split("Bearer ")[1]
            blacklisted_token = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
            if blacklisted_token:
                raise HTTPException(status_code=403, detail="Sign-in please")
            user = get_current_user(request=request, token=token)
            
            # Find the user in the database
            user = db.query(User).filter(User.email == user.get("email")).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Admins have unrestricted access
            if user.role == "admin":
                return await call_next(request)
            
            # Check user permissions for this specific API
            api_name = request.url.path.strip("/")  # Remove the leading slash
            api_name = api_name+"_api"
            # print("api_name: ", api_name)
            # print("user id: ", user.id)
             # Map API path to the corresponding permission column in Permission table
            api_permission_map = {
                "call_overview_api": "call_overview_api",
                "call_performance_api": "call_performance_api",
                "call_sub_kpis_api": "call_sub_kpis_api",
                "email_overview_api": "email_overview_api",
                "email_performance_api": "email_performance_api",
                "email_sub_kpis_api": "email_sub_kpis_api",
                "task_overview_api": "task_overview_api",
                "task_performance_api": "task_performance_api",
                "task_sub_kpis_api": "task_sub_kpis_api",
                "analytics_email_api": "analytics_email_api",
                "analytics_email_subkpis_api": "analytics_email_subkpis_api",
                "analytics_sales_service_api": "analytics_sales_service_api",
                "analytics_booking_api": "analytics_booking_api",
                "analytics_booking_subkpis_api": "analytics_booking_subkpis_api",
                "analytics_conversion_api": "analytics_conversion_api",
                "date_filter": "date_filter"
            }
            permission_column = api_permission_map.get(api_name)
            
            if permission_column:
                permission = db.query(Permission).filter(Permission.user_id == user.id).first()
                db.refresh(permission)
                # print(permission.analytics_booking_api)
                if not permission or not getattr(permission, permission_column, False):
                    raise HTTPException(status_code=403, detail="Access denied")
            
            response = await call_next(request)
            return response
        
        except HTTPException as exc:
            logging.error(f"HTTP Exception: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail}
            )

        except Exception as exc:
            logging.error(f"Unexpected error: {str(exc)}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Internal server error {exc}"}
            )