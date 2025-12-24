from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Grocery System"
    DATABASE_URL: str
    
    # New Auth Config
    SECRET_KEY: str = "CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PROD" # Generates tokens
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 mins for dev (Spec says 15, but 30 is easier for dev)

    class Config:
        env_file = ".env"

settings = Settings()