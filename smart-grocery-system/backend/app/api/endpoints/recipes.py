from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from pydantic import BaseModel # <--- Ensure BaseModel is imported
from app.utils.suggestion_logic import suggest_recipes # <--- Import this
from app.schemas.recipe import RecipeSuggestion # <--- Import this

from app.db.session import get_db
from app.api import deps
from app.models.recipe import Recipe, RecipeIngredient
from app.models.ingredient import Ingredient
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate

router = APIRouter()

# --- Helper Function to Handle Custom Ingredients ---
def get_or_create_ingredient(db: Session, item) -> UUID:
    if item.ingredient_id:
        return item.ingredient_id

    if item.name:
        existing = db.query(Ingredient).filter(
            func.lower(Ingredient.name) == item.name.lower()
        ).first()
        
        if existing:
            return existing.id
        
        new_ing = Ingredient(
            name=item.name,
            aisle="Other",
            default_unit=item.unit
        )
        db.add(new_ing)
        db.flush()
        return new_ing.id
    
    raise HTTPException(status_code=400, detail="Ingredient must have either an ID or a Name")

# --- Helper Schema for Selection Toggle ---
class RecipeSelect(BaseModel):
    is_selected: bool

@router.get("/", response_model=List[RecipeResponse])
def read_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    recipes = db.query(Recipe).filter(Recipe.user_id == current_user.id).options(
        joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
    ).all()
    
    results = []
    for r in recipes:
        r_dict = r.__dict__
        
        # --- FIX: Handle None values for existing recipes ---
        if r.is_selected is None:
            r_dict['is_selected'] = False
        # ---------------------------------------------------

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


@router.get("/suggestions", response_model=List[RecipeSuggestion])
def get_recipe_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Compare inventory against recipes and return sorted matches.
    """
    return suggest_recipes(db, current_user.id)


@router.get("/{recipe_id}", response_model=RecipeResponse)
def read_recipe(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id, 
        Recipe.user_id == current_user.id
    ).options(
        joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient)
    ).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    r_dict = recipe.__dict__
    
    # --- FIX: Handle None values for existing recipes ---
    if recipe.is_selected is None:
        r_dict['is_selected'] = False
    # ---------------------------------------------------

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
    new_recipe = Recipe(
        title=recipe_in.title,
        instructions=recipe_in.instructions,
        servings=recipe_in.servings,
        user_id=current_user.id
        # is_selected defaults to False in model, so it's safe here
    )
    db.add(new_recipe)
    db.flush() 

    for item in recipe_in.ingredients:
        ing_id = get_or_create_ingredient(db, item)
        recipe_ing = RecipeIngredient(
            recipe_id=new_recipe.id,
            ingredient_id=ing_id,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(recipe_ing)
    
    db.commit()
    db.refresh(new_recipe)
    return read_recipe(str(new_recipe.id), db, current_user)

@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id, 
        Recipe.user_id == current_user.id
    ).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.title = recipe_in.title
    recipe.instructions = recipe_in.instructions
    recipe.servings = recipe_in.servings

    db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
    
    for item in recipe_in.ingredients:
        ing_id = get_or_create_ingredient(db, item)
        new_ing = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ing_id,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(new_ing)
    
    db.commit()
    db.refresh(recipe)
    return read_recipe(str(recipe.id), db, current_user)

@router.patch("/{recipe_id}/select", response_model=RecipeResponse)
def toggle_recipe_selection(
    recipe_id: str,
    selection: RecipeSelect,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Toggle the 'is_selected' status of a recipe.
    """
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id, 
        Recipe.user_id == current_user.id
    ).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.is_selected = selection.is_selected
    db.commit()
    db.refresh(recipe)
    
    return read_recipe(str(recipe.id), db, current_user)