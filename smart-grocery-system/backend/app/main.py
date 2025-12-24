from fastapi import FastAPI
from app.core.config import settings
from app.api.endpoints import auth
from fastapi.middleware.cors import CORSMiddleware  # <--- Import this
from app.api.endpoints import auth, recipes # <--- 1. Import recipes
from app.api.endpoints import auth, recipes, ingredients # <--- Import
app = FastAPI(title=settings.PROJECT_NAME)


# --- ADD CORS MIDDLEWARE ---
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the Auth Router
# We prefix with /api/v1/auth to match your specs
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
# --- 2. Include the recipes router ---
app.include_router(recipes.router, prefix="/api/v1/recipes", tags=["recipes"]) 

# --- 3. Include the ingredients router ---
app.include_router(ingredients.router, prefix="/api/v1/ingredients", tags=["ingredients"]) 

@app.get("/")
def root():
    return {"message": "Welcome to the Smart Grocery System API"}