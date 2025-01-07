from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.database.auth.token import verify_token
from app.database.models.models import User  # Import your User model
from app.database.db.db_connection import get_db
# from app.endpoints.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
#     # credentials_exception = HTTPException(
#     #     status_code=status.HTTP_401_UNAUTHORIZED,
#     #     detail="Could not validate credentials",
#     #     headers={"WWW-Authenticate": "Bearer"},
#     # )

#     # # Verify the token and get the user data (email or user ID)
#     # user_data = verify_token(token_str, credentials_exception)
#     # print("user data: ", user_data)
    
#     # # Assuming your token contains an 'email' field in the payload after decoding
#     # user = db.query(User).filter(User.email == user_data.email).first()
    
#     # if user is None:
#     #     raise credentials_exception

#     # return user
#     auth_header = request.headers.get("Authorization")
#     # print(f"Authorization Header: {auth_header}")

#     # Use the token from the query parameter if Authorization header is missing
#     if not auth_header and not token:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Token missing or invalid",
#         )
    
#     if auth_header and auth_header.startswith("Bearer "):
#         token = auth_header.split(" ")[1]
#         # print(f"Extracted Token: {token}")

#     # Proceed to verify the token
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Invalid or expired token",
#         headers={"WWW-Authenticate": "Bearer"},
#     )

#     try:
#         token_data = verify_token(token, credentials_exception)
#         return {"isAuthenticated": True, "email": token_data.email}
#     except HTTPException as e:
#         raise e
#     except JWTError:
#         raise credentials_exception

def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    """
    Extracts and verifies the token from the Authorization header or query parameter.
    Returns user data if the token is valid.
    """

    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    
    # Raise error if no token is provided in either the header or query parameter
    if not auth_header and not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing or invalid",
        )
    
    # Extract token from the Authorization header if present
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    # Create exception for invalid or expired tokens
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify the token
        token_data = verify_token(token, credentials_exception)
        # print("Token data: ", token_data)
        
        # Return the decoded token data (e.g., user email or ID)
        return {"isAuthenticated": True, "email": token_data.email}
    except HTTPException as e:
        # Handle explicit HTTP exceptions (e.g., invalid credentials)
        raise e
    except JWTError:
        # Handle generic JWT decoding errors
        raise credentials_exception
