from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.auth import token
from app.database.models.models import User  # Import your User model
from app.database.db.db_connection import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user(db: Session = Depends(get_db), token_str: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify the token and get the user data (email or user ID)
    user_data = token.verify_token(token_str, credentials_exception)
    
    print("User data:", user_data)
    
    # Assuming your token contains an 'email' field in the payload after decoding
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if user is None:
        raise credentials_exception

    return user
