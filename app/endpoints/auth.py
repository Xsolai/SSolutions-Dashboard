from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from uuid import uuid4
from app.database.db.db_connection import get_db
from app.database.models import models
from app.src.components.email_service import send_reset_password_email, send_registration_otp
from app.database.auth.hashing import Hash
from typing import Dict
import time , random
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.database.auth.jwt_handler import decode_jwt
from app.database.models.models import User
from app.database.db.db_connection import get_db
from sqlalchemy.orm import Session


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


@router.post("/verify-token")
async def verify_token(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint to verify the JWT token passed in the Authorization header.
    """
    # Extract Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing or invalid",
        )
    
    # Extract the token
    token = auth_header.split(" ")[1]  # "Bearer <token>"
    
    try:
        # Decode and validate the token
        payload = decode_jwt(token)

        # Fetch user from the database using the decoded user_id
        user = db.query(User).filter(User.id == payload["user_id"]).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # If user exists, token is valid
        return {"isAuthenticated": True}

    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

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

    # Construct reset link with uid/token format
    reset_link = f"http://localhost:3000/reset-password/{user.id}/{reset_token}"

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

    # Get the user ID associated with the token
    user_id = reset_tokens[data.token]  # Do not pop the token here
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    # Check if the new password matches the last password
    if Hash.verify(user.password, data.new_password):  # Assuming `Hash.verify` compares the hash with the plain-text password
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the last password"
        )

    # Hash the new password and update it
    hashed_password = Hash.bcrypt(data.new_password)
    user.password = hashed_password
    db.commit()

    # Remove the token only after successful reset
    reset_tokens.pop(data.token, None)

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
def resend_otp(request: OTPVerificationRequest, db: Session = Depends(get_db)):
    """
    Resends an OTP for email verification during registration.

    Args:
        request (OTPVerificationRequest): Contains the email of the user.
        db (Session): Database session dependency.

    Returns:
        JSON response indicating OTP has been resent.
    """
    stored_otp_data = otp_storage.get(request.email)

    # Check if email exists in temporary storage
    if not stored_otp_data:
        raise HTTPException(status_code=404, detail="No registration process found for this email.")

    # Generate a new OTP
    otp = str(random.randint(100000, 999999))
    expiry = time.time() + 300  # New OTP valid for 5 minutes

    # Update OTP storage
    otp_storage[request.email]["otp"] = otp
    otp_storage[request.email]["expiry"] = expiry

    # Resend OTP via email
    try:
        subject = "Your Resent Registration OTP"
        # Directly pass the required parameters
        send_registration_otp(
            recipient_email=request.email,
            subject=subject,
            otp=otp
        )
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend OTP.")

    return {"message": "OTP has been resent to your email. Please verify to complete registration."}