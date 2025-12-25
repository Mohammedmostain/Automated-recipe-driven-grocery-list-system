from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.recipe import Recipe
from app.models.inventory import Inventory
from app.utils.grocery_logic import parse_quantity # Re-use our helper

def suggest_recipes(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """
    Returns a list of recipes sorted by how many ingredients the user currently has.
    """
    
    # 1. Fetch all Recipes and Inventory
    recipes = db.query(Recipe).filter(Recipe.user_id == user_id).all()
    inventory = db.query(Inventory).filter(Inventory.user_id == user_id).all()

    # 2. Build Inventory Lookup Map
    # Key: (ingredient_id, unit) -> Value: Total Quantity
    inventory_map = {}
    for item in inventory:
        key = (item.ingredient_id, item.unit)
        qty = parse_quantity(item.quantity)
        
        if key not in inventory_map:
            inventory_map[key] = 0.0
        inventory_map[key] += qty

    results = []

    # 3. Analyze Each Recipe
    for recipe in recipes:
        total_ingredients = len(recipe.ingredients)
        if total_ingredients == 0:
            continue

        missing_ingredients = []
        matches = 0

        for r_ing in recipe.ingredients:
            required_qty = parse_quantity(r_ing.quantity)
            key = (r_ing.ingredient_id, r_ing.unit)

            # Check if we have it
            if key in inventory_map:
                owned_qty = inventory_map[key]
                
                if owned_qty >= required_qty:
                    # Full match: We have enough
                    matches += 1
                else:
                    # Partial match: We have some, but not enough
                    missing_amount = required_qty - owned_qty
                    missing_ingredients.append({
                        "name": r_ing.ingredient.name,
                        "missing_qty": f"{missing_amount:.2f}".rstrip('0').rstrip('.'),
                        "unit": r_ing.unit
                    })
            else:
                # No match: We don't have this ingredient (or unit mismatch)
                missing_ingredients.append({
                    "name": r_ing.ingredient.name,
                    "missing_qty": r_ing.quantity,
                    "unit": r_ing.unit
                })

        # Calculate Score
        match_percentage = int((matches / total_ingredients) * 100)

        results.append({
            "id": recipe.id,
            "title": recipe.title,
            "servings": recipe.servings,
            "match_percentage": match_percentage,
            "missing_ingredients": missing_ingredients
        })

    # 4. Sort by Match Percentage (Highest First)
    results.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return results