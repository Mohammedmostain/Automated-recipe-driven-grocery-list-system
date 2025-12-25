import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean # <--- Add Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    instructions = Column(Text, nullable=True)
    servings = Column(Integer, default=4)
    is_selected = Column(Boolean, default=False) # <--- Add this line
    # Relationships
    user = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False)
    
    quantity = Column(String, nullable=False) # e.g. "500", "1/2"
    unit = Column(String, nullable=True)      # e.g. "g", "cup"

    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")