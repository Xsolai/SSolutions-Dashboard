from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.models.models import RolePermission, User
from app.database.scehmas.schemas import UpdateRolePermission
from app.database.db.db_connection import get_db
from app.src.components.email_service import send_email_to_user

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