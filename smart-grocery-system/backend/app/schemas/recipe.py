from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

# --- Nested Schemas ---

# Base schema for shared fields
class RecipeIngredientBase(BaseModel):
    quantity: str
    unit: Optional[str] = None

# INPUT schema: Now accepts EITHER ingredient_id OR name
class RecipeIngredientCreate(RecipeIngredientBase):
    ingredient_id: Optional[UUID] = None
    name: Optional[str] = None 

class RecipeIngredientResponse(RecipeIngredientBase):
    id: UUID
    ingredient_id: UUID
    name: str 

    class Config:
        from_attributes = True

# --- Recipe Schemas ---

class RecipeBase(BaseModel):
    title: str
    instructions: Optional[str] = None
    servings: int = 4

class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []

class RecipeUpdate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []

class RecipeResponse(RecipeBase):
    id: UUID
    ingredients: List[RecipeIngredientResponse] = []

    class Config:
        from_attributes = True