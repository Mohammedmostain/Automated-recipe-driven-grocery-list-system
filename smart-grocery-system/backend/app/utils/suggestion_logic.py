from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.recipe import Recipe
from app.models.inventory import Inventory
# We no longer need parse_quantity for the simplified logic

def suggest_recipes(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """
    Returns a list of recipes sorted by how many ingredients the user CURRENTLY HAS,
    ignoring specific quantities/units (Boolean matching).
    """
    
    # 1. Fetch all Recipes and Inventory
    recipes = db.query(Recipe).filter(Recipe.user_id == user_id).all()
    inventory = db.query(Inventory).filter(Inventory.user_id == user_id).all()

    # 2. Build Inventory Set (Just IDs)
    # We use a Python Set for O(1) instant lookups
    owned_ingredient_ids = {item.ingredient_id for item in inventory}

    results = []

    # 3. Analyze Each Recipe
    for recipe in recipes:
        total_ingredients = len(recipe.ingredients)
        if total_ingredients == 0:
            continue

        missing_ingredients = []
        matches = 0

        for r_ing in recipe.ingredients:
            # SIMPLIFIED LOGIC:
            # If the recipe ingredient ID exists in our inventory set, it's a match.
            if r_ing.ingredient_id in owned_ingredient_ids:
                matches += 1
            else:
                # We don't have it at all.
                # The "missing amount" is simply the full amount required by the recipe.
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