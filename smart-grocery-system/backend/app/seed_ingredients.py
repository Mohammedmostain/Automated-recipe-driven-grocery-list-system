import logging
from app.db.session import SessionLocal
from app.models.ingredient import Ingredient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COMMON_INGREDIENTS = [
    # Produce
    {"name": "Onion", "aisle": "Produce", "default_unit": "whole"},
    {"name": "Garlic", "aisle": "Produce", "default_unit": "clove"},
    {"name": "Tomato", "aisle": "Produce", "default_unit": "whole"},
    {"name": "Potato", "aisle": "Produce", "default_unit": "kg"},
    {"name": "Carrot", "aisle": "Produce", "default_unit": "whole"},
    {"name": "Spinach", "aisle": "Produce", "default_unit": "bunch"},
    
    # Meat
    {"name": "Chicken Breast", "aisle": "Meat", "default_unit": "kg"},
    {"name": "Ground Beef", "aisle": "Meat", "default_unit": "kg"},
    {"name": "Bacon", "aisle": "Meat", "default_unit": "pack"},
    
    # Dairy
    {"name": "Milk", "aisle": "Dairy", "default_unit": "L"},
    {"name": "Butter", "aisle": "Dairy", "default_unit": "block"},
    {"name": "Cheddar Cheese", "aisle": "Dairy", "default_unit": "block"},
    {"name": "Eggs", "aisle": "Dairy", "default_unit": "dozen"},
    
    # Pantry
    {"name": "Olive Oil", "aisle": "Oil & Vinegars", "default_unit": "L"},
    {"name": "Salt", "aisle": "Spices", "default_unit": "g"},
    {"name": "Black Pepper", "aisle": "Spices", "default_unit": "g"},
    {"name": "Rice", "aisle": "Grains", "default_unit": "kg"},
    {"name": "Pasta", "aisle": "Grains", "default_unit": "box"},
    {"name": "Flour", "aisle": "Baking", "default_unit": "kg"},
    {"name": "Sugar", "aisle": "Baking", "default_unit": "kg"},
]

def seed_ingredients():
    db = SessionLocal()
    try:
        logger.info("Starting ingredient seed...")
        count = 0
        for data in COMMON_INGREDIENTS:
            # Check if exists
            exists = db.query(Ingredient).filter(Ingredient.name == data["name"]).first()
            if not exists:
                ingredient = Ingredient(**data)
                db.add(ingredient)
                count += 1
        
        db.commit()
        logger.info(f"Successfully added {count} new ingredients.")
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_ingredients()