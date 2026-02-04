---
name: algorithmic-optimization
description: Guide for solving Constraint Satisfaction Problems (CSP) and Diet Optimization using PuLP (Linear Programming).
---

# Algorithmic Optimization (Diet Solver)

This skill focuses on solving deterministic optimization problems where "close enough" (LLM) is not acceptable.

## 1. When to use Linear Programming (LP)

Use LP when you have:
- **Objective**: Maximize/Minimize a variable (Cost, Protein, User Preference).
- **Variables**: Quantities of ingredients (g of Chicken, cups of Rice).
- **Constraints**: "Must have < 2000mg Sodium", "Protein > 150g".

**Don't use LLMs for this**. LLMs cannot do math reliably.

## 2. Tooling: PuLP

PuLP is choice for Python.

```python
import pulp

# 1. Define Problem
prob = pulp.LpProblem("Diet_Problem", pulp.LpMinimize)

# 2. Define Variables (Foods)
# lowBound=0 means you can't have negative food
food_vars = pulp.LpVariable.dicts("Food", food_list, lowBound=0, cat='Continuous')

# 3. Define Objective Function (Minimize Cost)
prob += pulp.lpSum([costs[f] * food_vars[f] for f in food_list])

# 4. Define Constraints (Nutritional Limits)
prob += pulp.lpSum([protein[f] * food_vars[f] for f in food_list]) >= 150, "Min_Protein"
prob += pulp.lpSum([cals[f] * food_vars[f] for f in food_list]) <= 2500, "Max_Calories"

# 5. Solve
prob.solve()
```

## 3. "Fuzzy" Optimization

Real humans don't eat optimal math. We need to add "Human Constraints":
- **Variety**: Constraint to limit "Chicken" to max 2 times/day.
- **Palatability**: Objective function should penalize repeating foods too often.
- **Integer Constraints (MIP)**: Use `cat='Integer'` if user only eats whole eggs (not 0.3 eggs).

## 4. Performance

- LP is fast (milliseconds for hundreds of variables).
- MIP (Integer Programming) is NP-Hard. Be careful with too many integer constraints. Use strict timeouts.
