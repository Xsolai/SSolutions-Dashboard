from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import uuid4
from app.database.db.db_connection import get_db
from app.database.models import models
from app.src.components.email_service import send_reset_password_email
from app.database.auth.hashing import Hash
from typing import Dict

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# Temporary in-memory storage for reset tokens
reset_tokens: Dict[str, int] = {}


class ForgetPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


@router.post("/forget-password/")
async def forget_password(request: ForgetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User with this email does not exist"
        )

    # Generate a unique reset token
    reset_token = str(uuid4())
    reset_tokens[reset_token] = user.id  # Map token to user ID

    # Construct reset link (adjust URL based on your frontend/backend setup)
    reset_link = f"http://your-frontend-url.com/reset-password?token={reset_token}"

    # Send the reset password email
    subject = "Reset Your Password"
    body = (
        f"Hello {user.email},\n\n"
        "We received a request to reset your password. Click the link below to reset it:\n"
        f"{reset_link}\n\n"
        "If you did not request this, please ignore this email.\n\n"
        "Best regards,\nYour App Team"
    )
    send_reset_password_email(user.email, subject, body)

    return {"message": "Reset password link has been sent to your email."}


@router.post("/reset-password/")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    if data.token not in reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid or expired reset token"
        )

    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Passwords do not match"
        )

    # Get the user ID associated with the token
    user_id = reset_tokens.pop(data.token)  # Remove token after use
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )

    # Hash the new password and update it
    hashed_password = Hash.bcrypt(data.new_password)
    user.password = hashed_password
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}
