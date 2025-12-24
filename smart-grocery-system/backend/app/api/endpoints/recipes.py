from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.api import deps
from app.models.recipe import Recipe, RecipeIngredient
from app.models.ingredient import Ingredient
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate

router = APIRouter()

@router.get("/", response_model=List[RecipeResponse])
def read_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve all recipes belonging to the current user.
    """
    recipes = db.query(Recipe).filter(Recipe.user_id == current_user.id).options(
        joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
    ).all()
    
    # Transform for the schema (flattening the nested ingredient name)
    results = []
    for r in recipes:
        r_dict = r.__dict__
        # Manually map the nested ingredient name for the response
        r_dict['ingredients'] = [
            {
                "id": ri.id,
                "ingredient_id": ri.ingredient_id,
                "name": ri.ingredient.name,
                "quantity": ri.quantity,
                "unit": ri.unit
            }
            for ri in r.ingredients
        ]
        results.append(r_dict)
    
    return results

@router.get("/{recipe_id}", response_model=RecipeResponse)
def read_recipe(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get a specific recipe by ID.
    """
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id, 
        Recipe.user_id == current_user.id
    ).options(
        joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
    ).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Manual Mapping
    r_dict = recipe.__dict__
    r_dict['ingredients'] = [
        {
            "id": ri.id,
            "ingredient_id": ri.ingredient_id,
            "name": ri.ingredient.name,
            "quantity": ri.quantity,
            "unit": ri.unit
        }
        for ri in recipe.ingredients
    ]
    return r_dict

@router.post("/", response_model=RecipeResponse)
def create_recipe(
    recipe_in: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new recipe with ingredients.
    """
    # 1. Create the Recipe Object
    new_recipe = Recipe(
        title=recipe_in.title,
        instructions=recipe_in.instructions,
        servings=recipe_in.servings,
        user_id=current_user.id
    )
    db.add(new_recipe)
    db.flush() # Flush to generate the new_recipe.id without committing yet

    # 2. Add Ingredients
    for item in recipe_in.ingredients:
        # Optional: Validate ingredient_id exists? 
        # For now, we trust the frontend or let FK constraint fail
        recipe_ing = RecipeIngredient(
            recipe_id=new_recipe.id,
            ingredient_id=item.ingredient_id,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(recipe_ing)
    
    db.commit()
    db.refresh(new_recipe)
    
    # Re-query to get the joined data for the response
    return read_recipe(str(new_recipe.id), db, current_user)

@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update a recipe. 
    NOTE: This replaces the ingredient list entirely.
    """
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id, 
        Recipe.user_id == current_user.id
    ).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # 1. Update Basic Fields
    recipe.title = recipe_in.title
    recipe.instructions = recipe_in.instructions
    recipe.servings = recipe_in.servings

    # 2. Handle Ingredients (Delete All & Re-Add Strategy)
    # Clear existing
    db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
    
    # Add new
    for item in recipe_in.ingredients:
        new_ing = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=item.ingredient_id,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(new_ing)
    
    db.commit()
    db.refresh(recipe)
    
    return read_recipe(str(recipe.id), db, current_user)