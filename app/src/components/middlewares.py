from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.database.auth.oauth2 import get_current_user
from app.database.models.models import RolePermission, User
from app.database.db.db_connection import get_db
from starlette.middleware.base import BaseHTTPMiddleware
from app.src.logger import logging


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# async def role_based_access_control(call_next: Response, request: Request, db: Session = Depends(get_db)):
#     authorization_header = request.headers.get("Authorization")
#     if not authorization_header or not authorization_header.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
#     token = authorization_header.split("Bearer ")[1]
#     # print("Token: ", token)
#     user = get_current_user(request=request, token=token)
#     # print("User: ", user)
#     # print("email from a dict: ", user.get("email"))
#     user = db.query(models.User).filter(models.User.email == user.get("email")).first()
#     if user.role == "admin":
#         return  # Admins have unrestricted access
    
#     # role_permission = db.query(RolePermission).filter(RolePermission.role == user.role).first()
#     # if not role_permission:
#     #     raise HTTPException(status_code=403, detail="No permissions set for this role")
    
#     # path = request.url.path
#     # method = request.method.upper()
#     # allowed = role_permission.permissions.get(f"{method}:{path}", False)
    
#     # if not allowed:
#     #     raise HTTPException(status_code=403, detail="Access denied")
#     role_permission = db.query(RolePermission).filter(RolePermission.role == user.role).first()
#     print("Role permission: ", user.role, RolePermission.role)
#     if not role_permission:
#         raise HTTPException(status_code=403, detail="No permissions set for this role")
    
#     path = request.url.path
#     print("Path: ", path)
#     method = request.method.upper()
#     print("Method: ", method)
#     print("Permissions: ", role_permission.permissions)
#     if not role_permission.permissions.get(f"{method}:{path}", False):
#         raise HTTPException(status_code=403, detail="Access denied")

#     response = await call_next(request)
#     return response

class RoleBasedAccessMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            # Get the DB session
            db: Session = next(get_db())  # Manually resolve dependency
            
            # Extract and validate the Authorization header
            authorization_header = request.headers.get("Authorization")
            if not authorization_header or not authorization_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
            
            token = authorization_header.split("Bearer ")[1]
            user = get_current_user(request=request, token=token)
            
            # Find the user in the database
            user = db.query(User).filter(User.email == user.get("email")).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Admins have unrestricted access
            if user.role == "admin":
                return await call_next(request)
            
            # Check role permissions
            role_permission = db.query(RolePermission).filter(RolePermission.role == user.role).first()
            if not role_permission:
                raise HTTPException(status_code=403, detail="No permissions set for this role")
            
            path = request.url.path
            method = request.method.upper()
            if not role_permission.permissions.get(f"{method}:{path}", False):
                raise HTTPException(status_code=403, detail="Access denied")
            
            # Proceed with the request
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
                content={"detail": "Internal server error"}
            )