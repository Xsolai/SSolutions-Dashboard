from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class User(BaseModel):
    name: str
    email: str
    role: str
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