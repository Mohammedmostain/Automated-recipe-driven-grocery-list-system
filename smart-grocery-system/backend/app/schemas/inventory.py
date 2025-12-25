from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class InventoryBase(BaseModel):
    quantity: str
    unit: Optional[str] = None

class InventoryUpdate(InventoryBase):
    pass

class InventoryCreate(InventoryBase):
    ingredient_id: UUID

class InventoryResponse(InventoryBase):
    id: UUID
    ingredient_id: UUID
    ingredient_name: str # Mapped from relation

    class Config:
        from_attributes = True