from fastapi import FastAPI
from app.core.config import settings
from app.api.endpoints import auth

app = FastAPI(title=settings.PROJECT_NAME)

# Include the Auth Router
# We prefix with /api/v1/auth to match your specs
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
def root():
    return {"message": "Welcome to the Smart Grocery System API"}