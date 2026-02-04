---
name: ai-python-integration
description: Best practices for integrating Python AI microservices with Node.js/NestJS backends. Covers project structure, secure communication (Redis/HTTP), and serialization.
---

# AI Python Integration Standards

This skill defines how to build and integrate Python-based AI workers into the main Node.js ecosystem.

## 1. Architecture: The "Dual-Core" Pattern

- **Node.js (NestJS)**: The "Orchestrator". Handles HTTP requests, user authentication, and lightweight business logic.
- **Python (FastAPI)**: The "Calculator". Handles Heavy Math, NLP, ML inference, and Optimization tasks.

## 2. Communication Strategy

### Synchronous (Low Latency)
For realtime inference (e.g., "Suggest a recipe now"):
- Use internal HTTP (REST/gRPC).
- **FastAPI** exposes an endpoint.
- **NestJS** calls it using `axios` or `HttpService`.
- **Security**: Python service should ONLY accept connections from the Node.js container/IP (Network isolation).

### Asynchronous (Heavy Tasks)
For optimization (e.g., "Generate Weekly Meal Plan"):
- Use a **Job Queue** (Redis + BullMQ).
- **Node.js** pushes a job: `{ type: 'OPTIMIZE_DIET', payload: { ... } }`.
- **Python** (Celery or ARQ) consumes the job, processes it, and writes the result to the DB or notifies via Webhook.

## 3. Python Project Structure

```
/ai-worker
  /app
    /core       # Config, Logging
    /models     # Pydantic Schemas (Input/Output validation)
    /services   # Logic (Optimization, NLP)
    /api        # Endpoints
  main.py       # FastAPI entrypoint
  requirements.txt / poetry.lock
  Dockerfile
```

## 4. Data Validation (Pydantic)

**Crucial**: Never trust data sent from Node to Python blindly.
- Use **Pydantic** models to strictly validate inputs in Python.
- If data is invalid, fail fast and return a 400 to Node.

## 5. Dockerization

- Python workers must run in their own container.
- Use multi-stage builds to keep images small (don't ship gcc/compilers).
