
---

# 🛒 Smart Grocery System

The **Smart Grocery System** is a full-stack web application that helps users manage recipes, track pantry inventory, and automatically generate grocery lists based on selected recipes and available ingredients.

It also provides **recipe suggestions** based on what users already have at home.

---

## ✨ Features

### 🔐 Authentication

* User registration and login
* Secure JWT-based authentication
* Password hashing with bcrypt

### 🍽️ Recipes

* Create, read, update, and delete recipes
* Add ingredients to recipes (existing or custom)
* Select recipes for grocery list generation
* Clear recipe selections

### 📦 Inventory Management

* Track ingredients you already own
* Update quantities and units
* Prevent duplicate inventory items

### 🛍️ Smart Grocery List

* Automatically aggregates ingredients from selected recipes
* Subtracts existing inventory
* Groups items by grocery aisle
* Outputs a clean, ready-to-shop list

### 🤖 Recipe Suggestions

* Suggests recipes based on ingredient availability
* Shows match percentage
* Lists missing ingredients for each recipe

---

## 🧱 Tech Stack

### Backend

* **FastAPI**
* **SQLAlchemy**
* **PostgreSQL**
* **Alembic** (database migrations)
* **JWT Authentication**
* **Docker**

### Frontend

* **Next.js (App Router)**
* **TypeScript**
* **React Query**
* **Axios**
* **JWT cookie-based auth**

---

## 📁 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── utils/          # Business logic
│   │   └── main.py         # FastAPI entry point
│   ├── alembic/            # DB migrations
│   ├── requirements.txt
│   └── seed_ingredients.py
│
├── web/
│   ├── src/app/            # Next.js pages
│   ├── src/context/        # Auth context
│   ├── src/lib/            # API helpers
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Prerequisites

* Docker & Docker Compose
* Node.js (18+)
* Python (3.10+)

---

### 2️⃣ Start PostgreSQL (Docker)

```bash
docker-compose up -d
```

This starts a PostgreSQL database on `localhost:5432`.

---

### 3️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/grocery_app
```

Run database migrations:

```bash
alembic upgrade head
```

(Optional) Seed common ingredients:

```bash
python app/seed_ingredients.py
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

API docs:

```
http://localhost:8000/docs
```

---

### 4️⃣ Frontend Setup

```bash
cd web
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔌 API Overview

| Endpoint                      | Description           |
| ----------------------------- | --------------------- |
| `/api/v1/auth/register`       | Register user         |
| `/api/v1/auth/login`          | Login & get JWT       |
| `/api/v1/recipes`             | CRUD recipes          |
| `/api/v1/recipes/suggestions` | Suggested recipes     |
| `/api/v1/inventory`           | Manage inventory      |
| `/api/v1/grocery`             | Generate grocery list |

---

## 🧠 Core Logic Highlights

* **Grocery List Logic**

  * Aggregates ingredients from selected recipes
  * Subtracts inventory quantities
  * Groups results by aisle

* **Recipe Suggestions**

  * Boolean ingredient matching
  * Ranks recipes by availability
  * No unit/quantity complexity (MVP-friendly)

---

## 🚀 Future Improvements

* Unit conversions (cups → grams, etc.)
* Recipe sharing
* Nutrition information
* Mobile UI improvements

