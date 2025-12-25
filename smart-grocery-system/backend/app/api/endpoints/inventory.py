from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.api import deps
from app.models.inventory import Inventory
from app.models.ingredient import Ingredient
from app.schemas.inventory import InventoryResponse, InventoryUpdate, InventoryCreate
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[InventoryResponse])
def read_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    items = db.query(Inventory).filter(Inventory.user_id == current_user.id)\
        .options(joinedload(Inventory.ingredient)).all()
    
    return [
        InventoryResponse(
            id=item.id,
            ingredient_id=item.ingredient_id,
            ingredient_name=item.ingredient.name,
            quantity=item.quantity,
            unit=item.unit
        ) for item in items
    ]

@router.post("/", response_model=InventoryResponse)
def add_inventory_item(
    item_in: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Check if item already exists in inventory
    existing = db.query(Inventory).filter(
        Inventory.user_id == current_user.id,
        Inventory.ingredient_id == item_in.ingredient_id
    ).options(joinedload(Inventory.ingredient)).first()

    if existing:
        existing.quantity = item_in.quantity
        existing.unit = item_in.unit
        db.commit()
        db.refresh(existing)
        return InventoryResponse(
            id=existing.id,
            ingredient_id=existing.ingredient_id,
            ingredient_name=existing.ingredient.name,
            quantity=existing.quantity,
            unit=existing.unit
        )

    # Create new
    new_item = Inventory(
        user_id=current_user.id,
        ingredient_id=item_in.ingredient_id,
        quantity=item_in.quantity,
        unit=item_in.unit
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # Reload to get ingredient name
    db.refresh(new_item, attribute_names=['ingredient'])
    
    return InventoryResponse(
        id=new_item.id,
        ingredient_id=new_item.ingredient_id,
        ingredient_name=new_item.ingredient.name,
        quantity=new_item.quantity,
        unit=new_item.unit
    )

@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory_item(
    inventory_id: str,
    item_in: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    item = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.user_id == current_user.id
    ).options(joinedload(Inventory.ingredient)).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.quantity = item_in.quantity
    item.unit = item_in.unit
    db.commit()
    db.refresh(item)
    
    return InventoryResponse(
        id=item.id,
        ingredient_id=item.ingredient_id,
        ingredient_name=item.ingredient.name,
        quantity=item.quantity,
        unit=item.unit
    )