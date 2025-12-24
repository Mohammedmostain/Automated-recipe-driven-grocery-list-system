from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Later, import all your models here so Alembic can see them:
# from app.models.user import User
# from app.models.recipe import Recipe