from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

# --- Nested Schemas for Ingredients ---

class RecipeIngredientBase(BaseModel):
    ingredient_id: UUID
    quantity: str
    unit: Optional[str] = None

class RecipeIngredientCreate(RecipeIngredientBase):
    pass

class RecipeIngredientResponse(RecipeIngredientBase):
    id: UUID
    name: str # We will map this from the related Ingredient object

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
    # We include the nested ingredients in the response
    ingredients: List[RecipeIngredientResponse] = []

    class Config:
        from_attributes = True