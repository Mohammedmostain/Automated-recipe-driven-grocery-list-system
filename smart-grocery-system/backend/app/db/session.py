from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine
# pool_pre_ping=True handles checking if the connection is alive before using it
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()