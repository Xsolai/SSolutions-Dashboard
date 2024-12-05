from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime


class User(BaseModel):
    name: str
    email: EmailStr
    password1: str
    password2: str
    
    class Config():
        orm_mode = True
        
class UpdateUser(BaseModel):
    username: str
    title: str
    organization: str
    work_phone: str
    contact_number:str
    email:str
    
    class Config():
        orm_mode = True
        
        
class ShowUser(BaseModel):
    username: str
    email: str
    role:str
    
    class Config():
        orm_mode = True
        
class Login(BaseModel):
    email : str
    password : str
    
    class Config():
        orm_mode = True
        
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str
    
class RolePermissionSchema(BaseModel):
    role: str
    permissions: Dict[str, bool]  # Example: {"GET:/api/resource": True, "POST:/api/resource": False}

class UpdateRolePermission(BaseModel):
    role: str
    permissions: Dict[str, bool]