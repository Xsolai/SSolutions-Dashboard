from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.models.models import Permission
from app.database.models import models
from app.database.scehmas import schemas
from app.database.db.db_connection import get_db
from app.src.components.email_service import send_email_to_user
from app.database.auth import oauth2
from app.src.logger import logging

router = APIRouter(
    tags = ["Admin"]
)

@router.get("/admin/view-role-permissions")
def view_role_permissions(db: Session = Depends(get_db)):
    # Query the database to join User and Permission tables
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
                "task_overview_api": permission.task_overview_api,
                "task_performance_api": permission.task_performance_api,
                "task_sub_kpis_api": permission.task_sub_kpis_api,
                "analytics_email_api": permission.analytics_email_api,
                "analytics_email_subkpis_api": permission.analytics_email_subkpis_api,
                "analytics_sales_service_api": permission.analytics_sales_service_api,
                "analytics_booking_api": permission.analytics_booking_api,
                "analytics_booking_sub_kpis_api": permission.analytics_booking_subkpis_api,
                "analytics_conversion_api": permission.analytics_conversion_api,
                "date_filter": permission.date_filter,
            }
        }
        for user_id, email, permission in permissions
    ]


@router.get("/admin/approve/{user_id}")
def approve_user_request(user_id: str, db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.status == "pending").first()
    # Check if the user exists
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign permissions.")
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already processed.")
    
    user.status = "approved"
    db.commit()
    
    # Create a default permission record for the approved user
    default_permission = Permission(
        user_id=user.id,
        call_overview_api=True,
        call_performance_api=True,
        call_sub_kpis_api=True,
        email_overview_api=True,
        email_performance_api=True,
        email_sub_kpis_api=True,
        task_overview_api=True,
        task_performance_api=True,
        task_sub_kpis_api=True,
        analytics_email_api=True,
        analytics_email_subkpis_api=True,
        analytics_sales_service_api=True,
        analytics_booking_api=True,
        analytics_booking_subkpis_api=True,
        analytics_conversion_api=True,
        date_filter="all, yesterday"
    )
    db.add(default_permission)
    db.commit()
    send_email_to_user(user.status, email=user.email)
    return {"message": "User approved successfully."}

@router.get("/admin/reject/{user_id}")
def approve_user_request(user_id: str, db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.status == "pending").first()
    
    # Check if the user exists
    current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign permissions.")
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already processed.")
    
    # db.delete(user)
    user.status = "rejected"
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
    task_overview_api: bool = False,
    task_performance_api: bool = False,
    task_sub_kpis_api: bool = False,
    analytics_email_api: bool = False,
    analytics_email_subkpis_api: bool = False,
    analytics_sales_service_api: bool = False,
    analytics_booking_api: bool = False,
    analytics_booking_subkpis_api: bool = False,
    analytics_conversion_api: bool = False,
    date_filter: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
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
        permission.task_overview_api = task_overview_api
        permission.task_performance_api = task_performance_api
        permission.task_sub_kpis_api = task_sub_kpis_api
        permission.analytics_email_api = analytics_email_api
        permission.analytics_email_subkpis_api = analytics_email_subkpis_api
        permission.analytics_sales_service_api = analytics_sales_service_api
        permission.analytics_booking_api = analytics_booking_api
        permission.analytics_booking_subkpis_api = analytics_booking_subkpis_api
        permission.analytics_conversion_api = analytics_conversion_api
        permission.date_filter = date_filter

        # Commit the changes to the database
        db.commit()
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
    try:
        # Check if the user exists
        current_user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
        # Check if the current user is an admin
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can assign permissions.")
    
        users = db.query(models.User).all()
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
    except Exception as e:
        logging.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching users.")
