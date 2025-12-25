from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api import deps
from app.models.user import User
from app.utils.grocery_logic import generate_grocery_list
from typing import Dict, List

router = APIRouter()

# Schema for the response (A dictionary where Key=Aisle, Value=List of Items)
GroceryListResponse = Dict[str, List[dict]]

@router.get("/", response_model=GroceryListResponse)
def get_grocery_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Calculate the shopping list based on selected recipes and current inventory.
    """
    return generate_grocery_list(db, current_user.id)