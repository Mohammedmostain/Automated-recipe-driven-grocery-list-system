from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Grocery System"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()