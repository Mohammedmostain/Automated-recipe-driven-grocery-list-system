from sqlalchemy.orm import Session
from typing import Dict, List
from app.models.recipe import Recipe
from app.models.inventory import Inventory
from app.models.ingredient import Ingredient
from uuid import UUID

def parse_quantity(qty_str: str) -> float:
    """
    Converts strings like '1.5', '1/2', '2' into floats.
    Returns 0.0 if parsing fails.
    """
    if not qty_str:
        return 0.0
    try:
        if '/' in qty_str:
            num, den = qty_str.split('/')
            return float(num) / float(den)
        return float(qty_str)
    except ValueError:
        return 0.0

def generate_grocery_list(db: Session, user_id: UUID) -> Dict[str, List[dict]]:
    """
    1. Aggregates ingredients from selected recipes.
    2. Subtracts inventory.
    3. Groups by Aisle.
    """
    
    # --- 1. Fetch Selected Recipes ---
    selected_recipes = db.query(Recipe).filter(
        Recipe.user_id == user_id, 
        Recipe.is_selected == True
    ).all()

    # Dictionary Key: (ingredient_id, unit) -> Value: { 'qty': float, 'obj': Ingredient }
    # We group by Unit as well because we can't subtract 'grams' from 'cups' easily in MVP
    needed_map = {}

    for recipe in selected_recipes:
        for r_ing in recipe.ingredients:
            key = (r_ing.ingredient_id, r_ing.unit)
            qty_val = parse_quantity(r_ing.quantity)

            if key not in needed_map:
                needed_map[key] = {
                    'qty': 0.0,
                    'ingredient': r_ing.ingredient
                }
            
            needed_map[key]['qty'] += qty_val

    # --- 2. Fetch Inventory & Subtract ---
    user_inventory = db.query(Inventory).filter(Inventory.user_id == user_id).all()

    for item in user_inventory:
        qty_val = parse_quantity(item.quantity)
        key = (item.ingredient_id, item.unit)

        # Only subtract if we actually need this item (and units match)
        if key in needed_map:
            needed_map[key]['qty'] -= qty_val

    # --- 3. Format & Group by Aisle ---
    final_list = {}

    for (ing_id, unit), data in needed_map.items():
        remaining_qty = data['qty']
        ingredient = data['ingredient']

        # If we still need it (greater than generic "epsilon" to handle float errors)
        if remaining_qty > 0.01:
            aisle = ingredient.aisle or "Other"
            
            if aisle not in final_list:
                final_list[aisle] = []

            # Format quantity back to pretty string if it's an integer
            display_qty = f"{remaining_qty:.2f}".rstrip('0').rstrip('.')
            
            final_list[aisle].append({
                "name": ingredient.name,
                "quantity": display_qty,
                "unit": unit or ""
            })

    return final_list