# Technical Specification
## Smart Recipe Selection & Automated Grocery System

**Version:** 1.0  
**Last Updated:** December 2025

---

## 1. System Overview

A recipe-driven meal planning and grocery automation system that eliminates manual meal planning, ingredient tracking, and grocery list creation through real-time computation of derived data.

### 1.1 Core Philosophy
**Derived Data Over Stored Data** - Only source-of-truth data is persisted; all lists and calculations are computed at runtime.

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js Web   │         │  React Native    │
│   Application   │         │  Mobile App      │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │        REST API           │
         └───────────┬───────────────┘
                     ↓
         ┌───────────────────────┐
         │   FastAPI Backend     │
         │   (Python)            │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │   PostgreSQL          │
         │   Database            │
         └───────────────────────┘
```

### 2.2 Data Flow Pipeline

```
Recipe Selection
    ↓
Aggregate Ingredients (SUM quantities by ingredient)
    ↓
Subtract Inventory (ingredient.required - inventory.available)
    ↓
Filter Positive Values (keep only items where quantity > 0)
    ↓
Group by Aisle Category
    ↓
Return Organized Grocery List
```

---

## 3. Technology Stack

### 3.1 Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API Framework | FastAPI | High-performance async API |
| Authentication | JWT | Stateless auth (access + refresh tokens) |
| ORM | SQLAlchemy | Database abstraction |
| Migrations | Alembic | Schema version control |
| Validation | Pydantic | Request/response validation |
| Async Runtime | Uvicorn + asyncio | Concurrent request handling |
| Testing | Pytest + pytest-asyncio | Unit & integration tests |
| Containerization | Docker | Consistent deployment |

### 3.2 Database

| Component | Technology | Notes |
|-----------|-----------|-------|
| RDBMS | PostgreSQL 15+ | ACID compliance required |
| Indexing | B-tree indexes | On all foreign keys + common queries |
| Constraints | Foreign keys + Unique | Data integrity enforcement |
| Connection Pool | SQLAlchemy pool | Async connection management |

### 3.3 Frontend - Web

| Area | Technology | Purpose |
|------|-----------|---------|
| Framework | Next.js 14+ (React) | SSR + routing |
| Styling | Tailwind CSS | Utility-first CSS |
| State Management | TanStack Query (React Query) | Server state caching |
| Auth Storage | httpOnly cookies (recommended) | Secure token storage |
| API Client | Axios | HTTP requests with interceptors |
| Form Handling | React Hook Form | Performant forms |

### 3.4 Frontend - Mobile

| Area | Technology | Purpose |
|------|-----------|---------|
| Framework | React Native (Expo) | Cross-platform mobile |
| State Management | TanStack Query | Consistent with web |
| Secure Storage | expo-secure-store | Token persistence |
| Navigation | React Navigation | Native navigation |
| API | Shared REST endpoints | Unified backend |

### 3.5 DevOps & Deployment

| Area | Technology | Purpose |
|------|-----------|---------|
| Backend Hosting | Render / Railway | Container hosting |
| Web Hosting | Vercel | Next.js optimized |
| Database | Managed PostgreSQL | Render/Railway/Supabase |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Monitoring | Sentry (errors) + Logs | Error tracking |
| Environment | Docker Compose (local) | Development consistency |

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
User (1) ─────< Recipe (many)
             ├──< Inventory (many)
             
Recipe (many) ───< RecipeIngredient >─── Ingredient (many)

Inventory (many) ────> Ingredient (1)
```

### 4.2 SQLAlchemy Models

#### **models/user.py**
```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    recipes = relationship("Recipe", back_populates="user", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="user", cascade="all, delete-orphan")
```

#### **models/ingredient.py**
```python
from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    default_unit = Column(String(50), nullable=False)  # 'grams', 'pieces', 'liters'
    aisle = Column(String(100), nullable=False, index=True)  # 'Produce', 'Dairy', 'Meat'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    inventory_items = relationship("Inventory", back_populates="ingredient")
```

#### **models/recipe.py**
```python
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    servings = Column(Integer, default=1)
    instructions = Column(Text)
    is_selected = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    
    # Composite index for common query
    __table_args__ = (
        Index('idx_recipes_user_selected', 'user_id', 'is_selected'),
    )
```

#### **models/recipe_ingredient.py**
```python
from sqlalchemy import Column, Numeric, String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), nullable=False)
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('recipe_id', 'ingredient_id', name='uq_recipe_ingredient'),
    )
```

#### **models/inventory.py**
```python
from sqlalchemy import Column, Numeric, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="inventory")
    ingredient = relationship("Ingredient", back_populates="inventory_items")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'ingredient_id', name='uq_user_ingredient'),
        Index('idx_inventory_user_ingredient', 'user_id', 'ingredient_id'),
    )
```

---

## 5. Backend Services

### 5.1 Authentication Service
**Responsibilities:**
- User registration with email validation
- Login with JWT generation (access + refresh tokens)
- Token refresh endpoint
- Password hashing using bcrypt (cost factor: 12)
- Token blacklisting (optional, for logout)

**Security:**
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Refresh tokens stored in httpOnly cookies (web) or SecureStore (mobile)

### 5.2 Recipe Service
**Responsibilities:**
- CRUD operations for recipes
- Assign/remove ingredients from recipes
- Toggle `is_selected` status
- Validate ingredient quantities and units

**Business Rules:**
- Recipes are user-scoped (users only see their own)
- Deleting a recipe cascades to `recipe_ingredients`
- Ingredient assignments require valid ingredient IDs

### 5.3 Inventory Service
**Responsibilities:**
- Track current ingredient quantities
- Update inventory after shopping
- No automatic depletion (user-controlled)

**Business Rules:**
- Inventory is user-scoped
- Quantities must be non-negative
- Units should match ingredient default units (with conversion logic)

### 5.4 Ingredient Service
**Responsibilities:**
- Provide global ingredient catalog
- Search/filter ingredients
- Admin-only: Add new ingredients

**Business Rules:**
- Ingredients are global (shared across users)
- Names must be unique and normalized

### 5.5 Grocery List Computation Engine (Derived)

**Algorithm:**
```python
def compute_grocery_list(user_id: UUID) -> Dict[str, List[GroceryItem]]:
    # 1. Fetch selected recipes
    selected_recipes = Recipe.query.filter_by(
        user_id=user_id, 
        is_selected=True
    ).all()
    
    # 2. Aggregate ingredient requirements
    requirements = defaultdict(float)
    for recipe in selected_recipes:
        for recipe_ing in recipe.ingredients:
            # Convert to base unit
            base_qty = convert_to_base_unit(
                recipe_ing.quantity, 
                recipe_ing.unit
            )
            requirements[recipe_ing.ingredient_id] += base_qty
    
    # 3. Subtract inventory
    inventory = Inventory.query.filter_by(user_id=user_id).all()
    for inv_item in inventory:
        base_qty = convert_to_base_unit(inv_item.quantity, inv_item.unit)
        requirements[inv_item.ingredient_id] -= base_qty
    
    # 4. Filter positive values
    missing = {
        ing_id: qty 
        for ing_id, qty in requirements.items() 
        if qty > 0
    }
    
    # 5. Group by aisle
    grocery_list = defaultdict(list)
    for ing_id, qty in missing.items():
        ingredient = Ingredient.query.get(ing_id)
        grocery_list[ingredient.aisle].append({
            "ingredient": ingredient.name,
            "quantity": qty,
            "unit": ingredient.default_unit
        })
    
    return dict(grocery_list)
```

**Trigger Conditions:**
- Recipe selected/deselected
- Inventory updated
- Recipe ingredients modified

### 5.6 Recipe Matching Engine ("What Can I Make?")

**Algorithm:**
```python
def find_matching_recipes(user_id: UUID) -> List[RecipeMatch]:
    inventory = get_user_inventory(user_id)
    all_recipes = Recipe.query.filter_by(user_id=user_id).all()
    
    matches = []
    for recipe in all_recipes:
        required = recipe.get_ingredient_requirements()
        available = {ing_id: inventory.get(ing_id, 0) for ing_id in required}
        
        match_score = sum(
            min(available[ing_id], required[ing_id]) 
            for ing_id in required
        ) / sum(required.values())
        
        missing = [
            ing_id for ing_id in required 
            if available[ing_id] < required[ing_id]
        ]
        
        matches.append({
            "recipe": recipe,
            "match_percentage": match_score * 100,
            "missing_ingredients": missing
        })
    
    return sorted(matches, key=lambda x: x["match_percentage"], reverse=True)
```

---

## 6. REST API Endpoints

### 6.1 Authentication
```
POST   /api/v1/auth/register          # Create new user
POST   /api/v1/auth/login             # Login (returns JWT)
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Invalidate tokens
```

### 6.2 Recipes
```
GET    /api/v1/recipes                # List user's recipes (paginated)
POST   /api/v1/recipes                # Create recipe
GET    /api/v1/recipes/{id}           # Get recipe details
PUT    /api/v1/recipes/{id}           # Update recipe
DELETE /api/v1/recipes/{id}           # Delete recipe
POST   /api/v1/recipes/{id}/select    # Mark as selected
POST   /api/v1/recipes/{id}/unselect  # Mark as unselected
POST   /api/v1/recipes/{id}/ingredients  # Add ingredient to recipe
DELETE /api/v1/recipes/{id}/ingredients/{ingredient_id}  # Remove ingredient
```

### 6.3 Ingredients
```
GET    /api/v1/ingredients            # List all ingredients (paginated, searchable)
POST   /api/v1/ingredients            # Create ingredient (admin only)
GET    /api/v1/ingredients/{id}       # Get ingredient details
```

### 6.4 Inventory
```
GET    /api/v1/inventory              # Get user's inventory
POST   /api/v1/inventory              # Add/update inventory item
PUT    /api/v1/inventory/{id}         # Update quantity
DELETE /api/v1/inventory/{id}         # Remove from inventory
```

### 6.5 Derived Data (Computed)
```
GET    /api/v1/grocery-list           # Compute grocery list (real-time)
GET    /api/v1/recipes/matches        # Find recipes user can make
```

### 6.6 API Standards
- All endpoints return JSON
- Successful responses: 200 (OK), 201 (Created), 204 (No Content)
- Error responses: 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
- Pagination: `?page=1&limit=20` (default limit: 50, max: 100)
- Filtering: `?search=chicken&aisle=Meat`

---

## 7. Security Implementation

### 7.1 Authentication & Authorization
- **Password Hashing:** bcrypt with cost factor 12
- **JWT Structure:**
  ```json
  {
    "sub": "user_id",
    "exp": 1234567890,
    "type": "access|refresh"
  }
  ```
- **Token Storage:**
  - Web: httpOnly cookies (CSRF protection via SameSite=Strict)
  - Mobile: expo-secure-store
- **Authorization:** All endpoints (except auth) require valid JWT

### 7.2 Data Security
- **SQL Injection:** Prevented by SQLAlchemy ORM
- **XSS:** Input sanitization + CSP headers
- **CORS:** Whitelist frontend domains only
- **Rate Limiting:** 100 requests/minute per IP (auth endpoints: 5/minute)
- **Input Validation:** Pydantic models validate all inputs

### 7.3 User Data Isolation
- All queries scoped by `user_id` from JWT
- PostgreSQL Row-Level Security (RLS) as backup
- Foreign key constraints prevent orphaned data

---

## 8. Testing Strategy

### 8.1 Unit Tests (Pytest)
- **Coverage Target:** 80%+
- **Focus Areas:**
  - Grocery list computation logic
  - Recipe matching algorithm
  - Unit conversion functions
  - Authentication token handling

### 8.2 Integration Tests
- **Database Tests:** Use test PostgreSQL instance
- **API Tests:** Test all endpoints with valid/invalid inputs
- **Authentication Flow:** Register → Login → Protected routes

### 8.3 End-to-End Tests (Playwright/Cypress)
- **Critical User Flows:**
  1. Register → Add recipes → Select recipes → View grocery list
  2. Update inventory → Verify grocery list updates
  3. Use recipe matching → Select matched recipe

---

## 9. Deployment Strategy

### 9.1 Local Development
```bash
# Backend
docker-compose up  # Spins up FastAPI + PostgreSQL

# Frontend (Web)
cd web && npm run dev

# Frontend (Mobile)
cd mobile && expo start
```

### 9.2 Production Deployment

**Phase 1: Infrastructure**
1. Provision PostgreSQL database (Render/Railway)
2. Set up environment variables
3. Run Alembic migrations

**Phase 2: Backend**
1. Build Docker image
2. Deploy to Render/Railway
3. Configure health check endpoint (`/health`)

**Phase 3: Frontend**
1. Deploy Next.js to Vercel (automatic from `main` branch)
2. Configure environment variables (API URL)
3. Test API connectivity

**Phase 4: Mobile**
1. Build Expo app (EAS Build)
2. Submit to App Store / Play Store
3. Configure API endpoints for production

### 9.3 CI/CD Pipeline (GitHub Actions)
```yaml
# On push to main:
1. Run tests (pytest + jest)
2. Build Docker image
3. Deploy backend to Render
4. Deploy web to Vercel
5. Notify on Slack/Discord
```

---

## 10. Performance Considerations

### 10.1 Database Optimization
- **Indexes:** All foreign keys + frequently queried columns
- **Query Optimization:** Use `JOIN` instead of N+1 queries
- **Connection Pooling:** Max 20 connections per instance

### 10.2 API Optimization
- **Caching:** Cache ingredient catalog (1 hour TTL)
- **Pagination:** Default 50 items, max 100
- **Async Operations:** Use FastAPI's async for I/O-bound tasks

### 10.3 Frontend Optimization
- **React Query:** Cache API responses (5 min stale time)
- **Code Splitting:** Dynamic imports for recipe editor
- **Image Optimization:** Use Next.js Image component

---

## 11. Monitoring & Logging

### 11.1 Logging
- **Structured Logs:** JSON format with request ID
- **Log Levels:** ERROR, WARN, INFO, DEBUG
- **Sensitive Data:** Never log passwords or tokens

### 11.2 Monitoring
- **Error Tracking:** Sentry for exception monitoring
- **Metrics:** Response times, error rates
- **Alerts:** Slack notification for 5xx errors

---

## 12. Future Enhancements

### Phase 2 Features
- [ ] Meal calendar integration
- [ ] Nutritional analysis per recipe
- [ ] Recipe scaling (adjust serving sizes)
- [ ] Shopping history tracking
- [ ] Price estimation per grocery list

### Phase 3 Features
- [ ] Store-specific aisle layouts
- [ ] Recipe sharing with other users
- [ ] Barcode scanning for inventory updates
- [ ] Voice input for recipe selection
- [ ] Smart suggestions based on usage patterns

---

## 13. Success Metrics

### Technical Metrics
- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)
- Uptime: 99.5%
- Test coverage: > 80%

### User Metrics
- Grocery list accuracy: 100% (by design)
- Time to create grocery list: < 3 seconds
- Recipe selection conversion: 70%+ selected recipes result in shopping

---

## Appendix A: Unit Conversion System

All quantities stored in base units:
- **Weight:** grams
- **Volume:** milliliters
- **Count:** pieces

Conversion factors maintained in configuration:
```python
CONVERSIONS = {
    "kg": 1000,      # 1 kg = 1000 g
    "lb": 453.592,   # 1 lb = 453.592 g
    "oz": 28.3495,   # 1 oz = 28.3495 g
    "cup": 240,      # 1 cup = 240 ml (approximate)
    "tbsp": 15,      # 1 tbsp = 15 ml
    "tsp": 5         # 1 tsp = 5 ml
}
```

---

**Document Status:** Draft  
**Next Review:** After initial prototype