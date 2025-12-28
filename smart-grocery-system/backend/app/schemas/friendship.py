from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

# Base schema with shared properties
class FriendshipBase(BaseModel):
    pass

# Schema for creating a request (We only need to know who we are sending it to)
class FriendshipCreate(FriendshipBase):
    addressee_id: UUID

# Schema for updating a request (e.g., Accepting it)
class FriendshipUpdate(FriendshipBase):
    status: str

# Schema for reading a friendship (Response)
class FriendshipResponse(FriendshipBase):
    id: int
    requester_id: UUID
    addressee_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True