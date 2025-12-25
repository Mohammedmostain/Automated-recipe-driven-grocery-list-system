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
    is_selected: bool = False # <--- Add this

class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []

class RecipeUpdate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []

class RecipeResponse(RecipeBase):
    id: UUID
    ingredients: List[RecipeIngredientResponse] = []
    is_selected: bool # <--- Add this
    
    class Config:
        from_attributes = True

class MissingIngredient(BaseModel):
    name: str
    missing_qty: str
    unit: str

class RecipeSuggestion(BaseModel):
    id: UUID
    title: str
    servings: int
    match_percentage: int
    missing_ingredients: List[MissingIngredient]