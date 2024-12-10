from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.models.models import RolePermission, User, Permission
from app.database.models import models
from app.database.scehmas.schemas import UpdateRolePermission, User
from app.database.scehmas import schemas
from app.database.db.db_connection import get_db
from app.src.components.email_service import send_email_to_user
from app.database.auth import oauth2
from app.src.logger import logging

router = APIRouter(
    tags = ["Admin"]
)

@router.post("/admin/manage-role-permissions")
def manage_role_permissions(data: UpdateRolePermission, db: Session = Depends(get_db)):
    role_permission = db.query(RolePermission).filter(RolePermission.role == data.role).first()
    if not role_permission:
        # Create a new entry if role doesn't exist
        role_permission = RolePermission(role=data.role, permissions=data.permissions)
        db.add(role_permission)
    else:
        # Update existing permissions
        role_permission.permissions = data.permissions
    db.commit()
    return {"message": f"Permissions updated for role: {data.role}"}

@router.get("/admin/view-role-permissions")
def view_role_permissions(db: Session = Depends(get_db)):
    permissions = db.query(RolePermission).all()
    return [{"role": rp.role, "permissions": rp.permissions} for rp in permissions]


@router.get("/admin/approve/{user_id}")
def approve_user_request(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.status == "pending").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already processed.")
    
    user.status = "approved"
    db.commit()
    send_email_to_user(user.status, email=user.email)
    return {"message": "User approved successfully."}

@router.get("/admin/reject/{user_id}")
def approve_user_request(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.status == "pending").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already processed.")
    
    # db.delete(user)
    user.status = "rejected"
    db.commit()
    send_email_to_user(status=user.status, email=user.email)
    return {"message": "User rejected and removed from the system."}


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
        # Check if the user exists
        user = db.query(models.User).filter(models.User.email == current_user.get("email")).first()
        # Check if the current user is an admin
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can assign permissions.")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Check if the user already has permissions
        permission = db.query(Permission).filter(Permission.user_id == user_id).first()
        if permission:
            # Update existing permissions
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
        else:
            # Create new permission record
            permission = Permission(
                user_id=user_id,
                call_overview_api=call_overview_api,
                call_performance_api=call_performance_api,
                call_sub_kpis_api = call_sub_kpis_api,
                email_overview_api = email_overview_api,
                email_performance_api = email_performance_api,
                email_sub_kpis_api = email_sub_kpis_api,
                task_overview_api = task_overview_api,
                task_performance_api = task_performance_api,
                task_sub_kpis_api = task_sub_kpis_api,
                analytics_email_api = analytics_email_api,
                analytics_email_subkpis_api = analytics_email_subkpis_api,
                analytics_sales_service_api = analytics_sales_service_api,
                analytics_booking_api = analytics_booking_api,
                analytics_booking_subkpis_api = analytics_booking_subkpis_api,
                analytics_conversion_api = analytics_conversion_api,
                date_filter = date_filter
            )
            db.add(permission)
        
        db.commit()
        return {"message": "Permissions assigned successfully."}
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error assigning permissiioss: {e}")
        print(f"Error assigning permissiioss: {e}")