import os
from pathlib import Path

# Define the root directory name
ROOT_DIR = "smart-grocery-system"

# Define the directory structure (folders)
DIRECTORIES = [
    f"{ROOT_DIR}/backend/app/core",
    f"{ROOT_DIR}/backend/app/db",
    f"{ROOT_DIR}/backend/app/models",
    f"{ROOT_DIR}/backend/alembic",
    f"{ROOT_DIR}/web/src",
    f"{ROOT_DIR}/web/public",
]

# Define the files to create (paths relative to root)
FILES = [
    # Root files
    f"{ROOT_DIR}/docker-compose.yml",
    f"{ROOT_DIR}/README.md",
    
    # Backend files
    f"{ROOT_DIR}/backend/requirements.txt",
    f"{ROOT_DIR}/backend/.env",
    f"{ROOT_DIR}/backend/alembic.ini",
    
    # Backend App files (Python packages need __init__.py)
    f"{ROOT_DIR}/backend/app/__init__.py",
    f"{ROOT_DIR}/backend/app/main.py",
    
    # Core
    f"{ROOT_DIR}/backend/app/core/__init__.py",
    f"{ROOT_DIR}/backend/app/core/config.py",
    
    # DB
    f"{ROOT_DIR}/backend/app/db/__init__.py",
    f"{ROOT_DIR}/backend/app/db/base.py",
    f"{ROOT_DIR}/backend/app/db/session.py",
    
    # Models
    f"{ROOT_DIR}/backend/app/models/__init__.py",
    
    # Web files
    f"{ROOT_DIR}/web/package.json",
    f"{ROOT_DIR}/web/.env.local",
]

def create_structure():
    print(f"🚀 Initializing project structure for '{ROOT_DIR}'...\n")

    # 1. Create Directories
    for folder in DIRECTORIES:
        path = Path(folder)
        path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {folder}")

    # 2. Create Files
    for file_path in FILES:
        path = Path(file_path)
        if not path.exists():
            path.touch()
            print(f"📄 Created file: {file_path}")
        else:
            print(f"⏩ File already exists: {file_path}")

    print("\n✨ Project structure created successfully!")
    print(f"👉 Next step: 'cd {ROOT_DIR}' and start configuring your files.")

if __name__ == "__main__":
    create_structure()