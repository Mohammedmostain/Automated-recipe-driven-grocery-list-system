from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.ingredient import Ingredient
from pydantic import BaseModel
from uuid import UUID

class IngredientResponse(BaseModel):
    id: UUID
    name: str
    aisle: str
    default_unit: str | None
    
    class Config:
        from_attributes = True

router = APIRouter()

@router.get("/", response_model=List[IngredientResponse])
def read_ingredients(db: Session = Depends(get_db)):
    return db.query(Ingredient).order_by(Ingredient.name).all()