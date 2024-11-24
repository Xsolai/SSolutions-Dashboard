from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from uuid import uuid4
from app.database.db.db_connection import get_db
from app.database.models import models
from app.src.components.email_service import send_reset_password_email, send_registration_otp
from app.database.auth.hashing import Hash
from typing import Dict
import time , random

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


# Temporary storage for OTPs
otp_storage = {}

class RegistrationRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str  # Options: 'customer', 'employee'

class OTPVerificationRequest(BaseModel):
    email: EmailStr
    otp: str


@router.post("/register")
def register_user(request: RegistrationRequest, db: Session = Depends(get_db)):
    """
    Handles user registration by sending an OTP after receiving form data.
    Temporarily stores the form data and OTP until verification.

    Args:
        request (RegistrationRequest): Contains user details including username, email, password, and role.
        db (Session): Database session dependency.

    Returns:
        JSON response indicating OTP has been sent.
    """
    if request.role not in ["customer", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid role selected.")

    # Check if user already exists
    user = db.query(models.User).filter(
        (models.User.email == request.email) | (models.User.username == request.username)
    ).first()
    if user:
        raise HTTPException(status_code=400, detail="User with this email or username already exists.")

    # Generate OTP and store user details temporarily
    otp = str(random.randint(100000, 999999))
    expiry = time.time() + 300  # OTP valid for 5 minutes
    otp_storage[request.email] = {
        "otp": otp,
        "expiry": expiry,
        "data": {
            "username": request.username,
            "email": request.email,
            "password": request.password,  # Store hashed password securely later
            "role": request.role,
        },
    }

    # Send OTP via email
    try:
        subject = "Your Registration OTP"
        send_registration_otp(recipient_email=request.email, subject=subject, otp=otp)
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP.")

    return {"message": "OTP sent to your email. Please verify to complete registration."}


@router.post("/verify-otp")
def verify_otp(request: OTPVerificationRequest, db: Session = Depends(get_db)):
    """
    Verifies the OTP and completes the registration process.

    Args:
        request (OTPVerificationRequest): Contains the email and OTP.
        db (Session): Database session dependency.

    Returns:
        JSON response indicating success or failure.
    """
    stored_otp_data = otp_storage.get(request.email)

    # Validate OTP existence
    if not stored_otp_data:
        raise HTTPException(status_code=404, detail="No OTP found for this email.")

    # Check OTP expiration
    if time.time() > stored_otp_data["expiry"]:
        otp_storage.pop(request.email, None)  # Clean up expired OTP
        raise HTTPException(status_code=400, detail="OTP expired.")

    # Check OTP correctness
    if stored_otp_data["otp"] != request.otp:
        otp_storage.pop(request.email, None)  # Clean up invalid OTP
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # Retrieve user details from temporary storage
    user_data = stored_otp_data["data"]

    # Hash the password (ensure secure storage)
    hashed_password = Hash.bcrypt(user_data["password"])

    # Register the user
    try:
        new_user = models.User(
            username=user_data["username"],
            email=user_data["email"],
            password=hashed_password,
            role=user_data["role"],
        )
        db.add(new_user)
        db.commit()

        # Remove OTP after successful verification
        otp_storage.pop(request.email, None)

        return {"message": "Registration successful!"}
    except Exception as e:
        print(f"Error during user registration: {e}")
        raise HTTPException(status_code=500, detail="Failed to register user.")


@router.post("/resend-otp")
def resend_otp(email: EmailStr, db: Session = Depends(get_db)):
    """
    Resends a new OTP to the user's email.

    Args:
        email (EmailStr): The user's email address.
        db (Session): Database session dependency.

    Returns:
        JSON response indicating success or failure.
    """
    stored_otp_data = otp_storage.get(email)

    # Check if the email exists in OTP storage
    if not stored_otp_data:
        raise HTTPException(status_code=404, detail="No registration request found for this email.")

    # Check if the user is already registered
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="User with this email is already registered.")

    # Generate a new OTP
    new_otp = str(random.randint(100000, 999999))
    expiry = time.time() + 300  # OTP valid for 5 minutes
    otp_storage[email] = {**stored_otp_data, "otp": new_otp, "expiry": expiry}

    # Send the new OTP via email
    try:
        subject = "Your Resend OTP"
        send_registration_otp(recipient_email=email, subject=subject, otp=new_otp)
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend OTP.")

    return {"message": "A new OTP has been sent to your email."}
