from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.models.models import Permission
from app.database.models import models
from app.database.scehmas import schemas
from app.database.db.db_connection import get_db
from app.src.components.email_service import send_email_to_user
from app.database.auth import oauth2
from app.src.logger import logging
from app.src.components.email_service import send_reset_password_email
from app.database.auth.hashing import Hash
from app.endpoints.auth import RegistrationRequest, EMPLOYEE_DOMAIN, CUSTOMER_DOMAINS, reset_tokens
from uuid import uuid4


router = APIRouter(
    tags = ["Admin"]
)

# # Temporary in-memory storage for reset tokens
# reset_tokens: Dict[str, int] = {}
# EMPLOYEE_DOMAIN = "@solasolution.de"
# CUSTOMER_DOMAINS = ["@5vorflug.de", "@urlaubsguru.de", "@bild.de"]

@router.get("/admin/view-role-permissions")
def view_role_permissions(db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    # Query the database to join User and Permission tables
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view permissions.")
    permissions = (
        db.query(models.User.id, models.User.email, Permission)
        .join(Permission, models.User.id == Permission.user_id)
        .all()
    )
    
    # Format the response to include user email, ID, and permissions
    return [
        {
            "user_id": user_id,
            "email": email,
            "permissions": {
                "call_overview_api": permission.call_overview_api,
                "call_performance_api": permission.call_performance_api,
                "call_sub_kpis_api": permission.call_sub_kpis_api,
                "email_overview_api": permission.email_overview_api,
                "email_performance_api": permission.email_performance_api,
                "email_sub_kpis_api": permission.email_sub_kpis_api,
                "tasks_overview_api": permission.tasks_overview_api,
                "tasks_performance_api": permission.tasks_performance_api,
                "tasks_kpis_api": permission.tasks_kpis_api,
                "analytics_email_api": permission.analytics_email_api,
                "analytics_email_subkpis_api": permission.analytics_email_subkpis_api,
                "analytics_sales_service_api": permission.analytics_sales_service_api,
                "analytics_booking_api": permission.analytics_booking_api,
                "analytics_booking_subkpis_api": permission.analytics_booking_subkpis_api,
                "analytics_conversion_api": permission.analytics_conversion_api,
                "date_filter": permission.date_filter,
                "domains":permission.domains
            }
        }
        for user_id, email, permission in permissions
    ]


@router.get("/admin/approve/{user_id}")
def approve_user_request(user_id: str, db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    # Check if the user exists
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view this.")
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already processed.")
    
    # if user.status != "pending":
    #     raise HTTPException(status_code=400, detail="User already processed.")
    
    user.status = "approved"
    user.is_active = 1
    db.commit()
    db.refresh(user)
    
    existing_permission = db.query(models.Permission).filter(models.Permission.user_id == user.id).first()
    if not existing_permission:
        # Create a default permission record for the approved user
        default_permission = Permission(
            user_id=user.id,
            call_overview_api=True,
            call_performance_api=True,
            call_sub_kpis_api=True,
            email_overview_api=True,
            email_performance_api=True,
            email_sub_kpis_api=True,
            tasks_overview_api=True,
            tasks_performance_api=True,
            tasks_kpis_api=True,
            analytics_email_api=True,
            analytics_email_subkpis_api=True,
            analytics_sales_service_api=True,
            analytics_booking_api=True,
            analytics_booking_subkpis_api=True,
            analytics_conversion_api=True,
            date_filter="yesterday,last_week,last_month,last_year,all",
            domains="".join(user.email.split("@")[1].split(".")[0])
        )
        db.add(default_permission)
        db.commit()
    send_email_to_user(user.status, email=user.email)
    return {"message": "User approved successfully."}

@router.get("/admin/reject/{user_id}")
def approve_user_request(user_id: str, db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    # Check if the user exists
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view this.")
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already processed.")
    
    # db.delete(user)
    user.status = "rejected"
    user.is_active = 0
    db.commit()
    db.refresh(user)
    user_permissions = db.query(models.Permission).filter(models.Permission.user_id == user_id).all()
    if user_permissions:
        for permission in user_permissions:
            db.delete(permission)
        db.commit()
        
    send_email_to_user(status=user.status, email=user.email)
    return {"message": "User rejected."}

@router.post("/assign-permission")
def assign_permission(
    user_id: str,
    call_overview_api: bool = False,
    call_performance_api: bool = False,
    call_sub_kpis_api: bool = False,
    email_overview_api: bool = False,
    email_performance_api: bool = False,
    email_sub_kpis_api: bool = False,
    tasks_overview_api: bool = False,
    tasks_performance_api: bool = False,
    tasks_kpis_api: bool = False,
    analytics_email_api: bool = False,
    analytics_email_subkpis_api: bool = False,
    analytics_sales_service_api: bool = False,
    analytics_booking_api: bool = False,
    analytics_booking_subkpis_api: bool = False,
    analytics_conversion_api: bool = False,
    date_filter: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    domains: str = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)
):
    try:
        # Check if the current user is an admin
        admin_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
        if not admin_user or admin_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can assign permissions.")

        # Retrieve the existing permission for the target user
        permission = db.query(Permission).filter(Permission.user_id == user_id).first()
        if not permission:
            raise HTTPException(status_code=404, detail="Permissions for the user not found.")

        # Update the permission fields
        permission.call_overview_api = call_overview_api
        permission.call_performance_api = call_performance_api
        permission.call_sub_kpis_api = call_sub_kpis_api
        permission.email_overview_api = email_overview_api
        permission.email_performance_api = email_performance_api
        permission.email_sub_kpis_api = email_sub_kpis_api
        permission.tasks_overview_api = tasks_overview_api
        permission.tasks_performance_api = tasks_performance_api
        permission.tasks_kpis_api = tasks_kpis_api
        permission.analytics_email_api = analytics_email_api
        permission.analytics_email_subkpis_api = analytics_email_subkpis_api
        permission.analytics_sales_service_api = analytics_sales_service_api
        permission.analytics_booking_api = analytics_booking_api
        permission.analytics_booking_subkpis_api = analytics_booking_subkpis_api
        permission.analytics_conversion_api = analytics_conversion_api
        permission.date_filter = date_filter
        permission.domains = domains.lower()

        # Commit the changes to the database
        db.commit()
        db.refresh(permission)
        return {"message": "Permissions updated successfully."}
    except HTTPException as http_ex:
        db.rollback()
        raise http_ex
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating permissions: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while updating permissions.")

        
@router.get("/admin/users")
def get_users(db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign permissions.")

    users = db.query(models.User).filter(models.User.is_active==True).all()
    # print([user.email for user in users])
    if not users:
        raise HTTPException(status_code=404, detail="No users found.")
    return [{
        "user id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status
    } for user in users]
    
@router.get("/admin/companies")
def get_companies(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)
):
    # print("Current user: ", current_user.get("email"))
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # if not current_user or current_user.role.lower() != "admin":
    #     raise HTTPException(status_code=403, detail="Only admins can access this resource.")
    user_permissions = db.query(models.Permission).filter(models.Permission.user_id == current_user.id).first()
    if not user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permissions found for the user."
        )

    companies = [
        filter_type.strip() 
        for filter_type in user_permissions.domains.split(",") 
        if filter_type.strip()
    ]
    print("Companies: ", companies)
    # companies = db.query(models.AllQueueStatisticsData.customer).distinct().all()
    # if not companies:
    #     raise HTTPException(status_code=404, detail="No customer found.")
    # return [{"company": company.customer.lower()} for company in companies]
    result_set = set()
    for company in companies:
        company_name = company.lower()
        if "5vorflug" in company_name:
            # print(company_name)
            result_set.add("5vorflug")
        elif "urlaubsguru" in company_name:
            # print(company_name)
            result_set.add("Urlaubsguru")
        elif "bild" in company_name:
            # print(company_name)
            result_set.add("Bild")
        elif "galeria" in company_name:
            # print(company_name)
            result_set.add("Galeria")
        elif "adac" in company_name:
            # print(company_name)
            result_set.add("ADAC")
        elif company_name == "urlaub":
            # print(company_name)
            result_set.add("Urlaub")
    
    result = [{"company": name} for name in result_set] 
    if not result:
        return None
    
    return result 

@router.post("/admin/create_user")
def create_user(request: RegistrationRequest, db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """
    Handles user registration by determining the role based on the email domain, sending OTP,
    and temporarily storing user details for verification.
    """
    # print("Executing admin user creation")
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users.")
    if request.email.endswith(EMPLOYEE_DOMAIN):
        role = "customer"
    # elif any(request.email.lower().endswith(domain.lower()) for domain in CUSTOMER_DOMAINS):
    #     role = "customer"
    else:
        # raise HTTPException(status_code=400, detail="Email domain not allowed for registration.")
        role = "customer"

    print(request.email)
    # Check if the user already exists
    user = db.query(models.User).filter(
        (models.User.email == request.email) | (models.User.username == request.username)
    ).first()

    if user:
        if user.is_active:
            # If user exists and is active, raise an error
            raise HTTPException(
                status_code=400,
                detail=f"User with this email ({request.email}) or username ({request.username}) already exists."
            )
        else:
            # If user exists but is not active, update the user record
            print("User exists but is inactive. Reactivating...")
            user.username = request.username
            user.password = Hash.bcrypt(request.password)
            user.role = role
            user.status = "approved"
            user.is_active = True
            db.commit()
            reset_token = str(uuid4())
            reset_tokens[reset_token] = user.id

            # Construct reset link
            reset_link = f"https://frontend.d1qj820rqysre7.amplifyapp.com/reset-password/{user.id}/{reset_token}"
            print("reset link: ", reset_link)
            # Send reset email
            subject = "Reset Your Password"
            body = (
                f"Hello {user.email},\n\n"
                "Your account has been reactivated. Please reset your password. Click the link below to reset it:\n"
                f"{reset_link}\n\n"
                "Best regards,\nIhr Solasolution-Team"
            )
            send_reset_password_email(user.email, subject, body)
            existing_permission = db.query(models.Permission).filter(models.Permission.user_id == user.id).first()
            if not existing_permission:
                # Create a default permission record for the approved user
                default_permission = Permission(
                    user_id=user.id,
                    call_overview_api=True,
                    call_performance_api=True,
                    call_sub_kpis_api=True,
                    email_overview_api=True,
                    email_performance_api=True,
                    email_sub_kpis_api=True,
                    tasks_overview_api=True,
                    tasks_performance_api=True,
                    tasks_kpis_api=True,
                    analytics_email_api=True,
                    analytics_email_subkpis_api=True,
                    analytics_sales_service_api=True,
                    analytics_booking_api=True,
                    analytics_booking_subkpis_api=True,
                    analytics_conversion_api=True,
                    date_filter="yesterday,last_week,last_month,last_year,all",
                    domains="".join(user.email.split("@")[1].split(".")[0])
                )
                db.add(default_permission)
                db.commit()
                return {"message": "User reactivated successfully. Reset email sent."}

    # If user does not exist, create a new user
    hashed_password = Hash.bcrypt(request.password)

    try:
        new_user = models.User(
            username=request.username,
            email=request.email,
            password=hashed_password,
            role=role,
            status="approved",
            is_active=True
        )
        db.add(new_user)
        db.commit()

        created_user = db.query(models.User).filter(models.User.email == request.email).first()
        reset_token = str(uuid4())
        reset_tokens[reset_token] = created_user.id

        # Construct reset link
        reset_link = f"https://frontend.d1qj820rqysre7.amplifyapp.com/reset-password/{created_user.id}/{reset_token}"
        print("reset link: ", reset_link)
        # Send reset email
        subject = "Reset Your Password"
        body = (
            f"Hello {created_user.email},\n\n"
            "Your account has been created. Please reset your password. Click the link below to reset it:\n"
            f"{reset_link}\n\n"
            "Best regards,\nIhr Solasolution-Team"
        )
        send_reset_password_email(created_user.email, subject, body)
        
        existing_permission = db.query(models.Permission).filter(models.Permission.user_id == created_user.id).first()
        if not existing_permission:
            # Create a default permission record for the approved user
            default_permission = Permission(
                user_id=created_user.id,
                call_overview_api=True,
                call_performance_api=True,
                call_sub_kpis_api=True,
                email_overview_api=True,
                email_performance_api=True,
                email_sub_kpis_api=True,
                tasks_overview_api=True,
                tasks_performance_api=True,
                tasks_kpis_api=True,
                analytics_email_api=True,
                analytics_email_subkpis_api=True,
                analytics_sales_service_api=True,
                analytics_booking_api=True,
                analytics_booking_subkpis_api=True,
                analytics_conversion_api=True,
                date_filter="yesterday,last_week,last_month,last_year,all",
                domains="".join(created_user.email.split("@")[1].split(".")[0])
            )
            db.add(default_permission)
            db.commit()

        return {"message": "User registered successfully. Reset email sent."}

    except Exception as e:
        print(f"Error during user registration: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user.")    
    
@router.post("/admin/delete_user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """
    Deletes a user by their ID.
    Args:
        user_id (int): The ID of the user to delete.
        db (Session): Database session.

    Returns:
        dict: Success message.
    """
    # Fetch the user from the database
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users.")
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active== True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    try:
        # Delete the user from the database
        user.is_active = False
        db.commit()
        user_permissions = db.query(models.Permission).filter(models.Permission.user_id == user_id).all()
        if user_permissions:
            for permission in user_permissions:
                db.delete(permission)
            db.commit()
            return {"message": f"User with email {user.email} has been deleted successfully."}
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete the user.")
    
    