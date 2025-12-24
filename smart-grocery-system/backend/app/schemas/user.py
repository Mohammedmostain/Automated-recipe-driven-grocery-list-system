from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to return via API
class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read data from SQLAlchemy models