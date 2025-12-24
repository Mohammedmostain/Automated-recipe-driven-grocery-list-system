# Smart Recipe Selection & Automated Grocery System

A recipe-driven meal planning and grocery automation system that eliminates manual meal planning, ingredient tracking, and grocery list creation.

## Overview

This system allows users to simply select recipes they intend to cook, then automatically computes a precise, aisle-organized grocery list adjusted for what they already have at home. No more manual list writing, no more forgetting ingredients, no more buying duplicates.

## Key Features

### 🍳 Recipe Management
- Maintain a personal recipe library with structured ingredient lists
- Mark recipes as "selected to cook" with a single click
- Recipe selection automatically triggers grocery calculations

### 📦 Smart Inventory Tracking
- Track what's currently in your fridge and pantry
- System automatically subtracts available ingredients from shopping needs
- User-maintained quantities ensure accuracy

### 🛒 Automated Grocery Lists
- Dynamically generated based on selected recipes
- Automatically organized by store aisle
- Updates instantly when recipes are selected/deselected or inventory changes
- Zero manual editing required

### 🔍 Recipe Matching ("What Can I Make?")
- Analyzes current inventory to suggest recipes you can make now
- Shows match percentage and missing ingredients
- Helps reduce food waste and plan around what you have

## Core Philosophy

### Derived Data Over Stored Data

The system is built on a simple principle: **only source-of-truth data is stored; everything else is computed**.

**Stored Entities:**
- Recipes
- Ingredients (normalized)
- Recipe–Ingredient relationships
- Inventory quantities

**Derived Entities (computed at runtime):**
- Grocery lists
- Missing ingredient calculations
- Recipe match scores

This architecture guarantees correctness when recipes are checked/unchecked, inventory changes, or serving sizes are adjusted—without fragile synchronization logic.

## How It Works

### Data Flow

```
Recipe Selection
     ↓
Aggregate Ingredients
     ↓
Subtract Inventory
     ↓
Compute Missing Items
     ↓
Group by Aisle
     ↓
Display Grocery List
```

### Grocery List Generation Engine

The system follows this precise pipeline:

1. **Identify** all recipes marked as "selected to cook"
2. **Aggregate** ingredient requirements across those recipes
3. **Subtract** available inventory quantities
4. **Filter** out ingredients with zero remaining requirement
5. **Group** remaining items by aisle category

This computation runs automatically whenever:
- A recipe is selected or deselected
- Inventory quantities change
- Serving sizes are adjusted

## Technical Details

### Ingredient Normalization

Ingredients are centralized entities that enable:
- **Consistency**: Prevents "tomatoes" vs "tomato" vs "cherry tomatoes" issues
- **Aisle Grouping**: Each ingredient has a predefined aisle category
- **Accurate Subtraction**: Default units ensure math works correctly

### Inventory System

- Quantities are numeric and unit-consistent
- Used exclusively as an offset against recipe requirements
- Never auto-depleted (user decides when to update inventory)
- Maintains accuracy without complex tracking

## Design Goals

✅ **Minimize user input and decision fatigue**  
✅ **Ensure grocery lists are always accurate and self-updating**  
✅ **Avoid manual list editing**  
✅ **Maintain data consistency without fragile sync logic**

## Success Criteria

The system achieves its goals when:

- ✅ Users never manually write grocery lists
- ✅ Checking/unchecking a recipe always produces correct results
- ✅ Inventory changes immediately reflect in grocery calculations
- ✅ The system "just works" without user intervention

## Use Cases

### Scenario 1: Weekly Meal Prep
1. Browse recipe library
2. Select 5 recipes for the week
3. System generates complete shopping list
4. Shop once, cook all week

### Scenario 2: Using What You Have
1. Check "What Can I Make?" feature
2. See recipes ranked by what's already in inventory
3. Select high-match recipes to minimize shopping

### Scenario 3: Dynamic Planning
1. Select recipes for Monday-Wednesday
2. Shop and cook
3. Update inventory after shopping
4. Select Thursday-Friday recipes
5. System only adds new missing ingredients

---

## Future Enhancements

Potential features for consideration:
- Meal calendar integration
- Nutritional analysis
- Recipe scaling for different serving sizes
- Shopping history and price tracking
- Store-specific aisle layouts

---

**Philosophy**: Cook more, plan less. The system handles the logistics so you can focus on cooking.