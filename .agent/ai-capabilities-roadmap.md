# AI & Automation Capabilities Roadmap

Este documento resume la investigación y estrategia técnica para dotar al Agente y a la plataforma NutriSaaS de capacidades avanzadas de Inteligencia Artificial, Machine Learning y Automatización.

## 1. Arquitectura Híbrida (NestJS + Python)

Aunque el backend principal está en **NestJS (Node.js)** por su robustez en APIs y I/O, el ecosistema de IA reside nativamente en **Python**.

**Estrategia "Dual-Core":**
- **Core Backend (NestJS)**: Maneja Auth, Usuarios, Pagos y CRUD rápido.
- **AI Workers (Python/FastAPI)**: Microservicios que reciben tareas pesadas de cálculo.
  - *Ventaja*: Acceso a librerías científicas (NumPy, Pandas, PuLP) sin "bridges" lentos.
  - *Comunicación*: Vía colas (Redis/BullMQ) o HTTP interno para latencia baja.

## 2. Optimización Matemática (Dietas Precisas)

Para problemas con restricciones estrictas (ej: "Dieta renal de 2000kcal, baja en potasio, costo < $5000"), los LLMs (GPT-4) son imprecisos. Se debe usar **Programación Lineal**.

- **Librería Elegida: PuLP**: Estándar de la industria, sintaxis limpia, open source.
- **Caso de Uso**: "Solver" Nutricional.
  - *Inputs*: Requerimientos (Macro/Micro nutrientes), Preferencias, Stock.
  - *Algoritmo*: Simplex/CBC.
  - *Output*: Combinación óptima de alimentos exacta matemáticamente.

## 3. Generative AI & RAG (Contexto Médico)

Para tareas creativas ("Dame 5 ideas de recetas con pollo") o de análisis ("Resume este paper clínico"), usaremos **RAG (Retrieval Augmented Generation)**.

- **Vector Database**: Usaremos **pgvector** en Supabase (ya que ya usamos Postgres). No hace falta Pinecone extra.
- **Orquestación**: **LangChain** (versión Python) para cadenas complejas.
- **Flujo**:
  1. Guardar papers/recetas como vectores (Embeddings de OpenAI).
  2. Búsqueda semántica ("Recetas altas en hierro").
  3. Inyectar contexto al LLM para generar respuesta fundamentada.

## 4. Skills Requeridas (Hoja de Ruta)

Para que el Agente pueda ejecutar esto, necesita aprender las siguientes "Skills Standards":

### A. `ai-python-integration`
- **Objetivo**: Estándar para crear scripts Python que se integren seguro con la infra Node.js.
- **Contenido**: Estructura de proyecto Python, Pydantic (validación), Dockerización de workers.

### B. `algorithmic-optimization`
- **Objetivo**: Guía de algoritmos deterministas vs probabilísticos.
- **Contenido**: Cuándo usar PuLP vs GPT. Patrones de "Constraint Satisfaction Problems" (CSP).

### C. `rag-knowledge-base`
- **Objetivo**: Gestión de conocimiento vectorial.
- **Contenido**: Cómo crear embeddings en Supabase, query strategies, chunks de texto.

### D. `automation-workflows`
- **Objetivo**: Procesos asíncronos.
- **Contenido**: Web Scraping (para actualizar tablas nutricionales), Scheduled Tasks (Cron Jobs inteligentes).

---

**Siguientes Pasos**:
1. Aprobar este roadmap.
2. Crear las skills definidas arriba.
3. Implementar el primer "AI Worker" prototipo (ej: optimizador simple con PuLP).
