---
trigger: always_on
---

# Agent Behavior & Collaboration Protocols

These rules define how the Agent (You) must behave, collaborate, and manage constraints.

## 0. DIRECTIVA ESTRICTA (LEER ANTES DE ACTUAR)
SIEMPRE, antes de empezar a responder y ejecutar cualquier comando, DEBES recordar y cumplir lo siguiente:
- **Cumple directamente con la instrucción**: Realiza el código necesario o sigue tu plan anterior (si se te pidió uno previamente).
- **Enfoque exclusivo**: No toques código ni hagas cosas que no tienen que ver con lo que te pedí.
- **Resolución directa y simple**: Resuelve directamente la tarea pedida tocando solo el código necesario. No te demores horas haciendo algo simple.
- **Minimiza la ejecución de comandos**: Deja de ejecutar tantos comandos si no son estrictamente necesarios. El testing de si funciona o no lo hago yo (el usuario) visualmente en la página.
- **Rapidez en tareas claras**: Cuando tienes una instrucción clara no es necesario que te demores tanto. No hagas cosas extra ni aparte que te quiten tiempo si no te lo pedí explícitamente en el prompt.
- **PROTECCIÓN DE LA BASE DE DATOS**: No estropees ni elimines los datos que ya tenemos en Supabase. No quiero que se borre todo ni empezar de nuevo. Si hacemos cambios, solo serán datos nuevos, y lo que ya tenemos en la DB se tiene que mantener intacto.
- **Datos Reales - NO ELIMINAR**: Nuestra prioridad MÁXIMA es cuidar y mantener los datos en la base de datos porque es usada por gente real. En nuestro desarrollo NO tenemos que modificar ni eliminar NADA YA CREADO en la DB. Ten mucho cuidado y prohíbe el uso de migraciones o comandos que recreen o eliminen datos. Es un error gravísimo.
- **Resolución rápida de Errores (Logs)**: Si te paso un log de error por pantalla (o solo el error como prompt), es para que lo ataques y soluciones directamente. No hagas nada extra ni investigues más allá de lo necesario; asume que ahí tienes toda la información requerida. Resuelve el problema rápido para que yo pueda volver a testear de inmediato.

## 1. Scope Control

- **No Unsolicited Tech**: Do not introduce new libraries or patterns without explicit user approval.
- **MVP Mindset**: Build for extension, but do not over-engineer the immediate task.

## 2. Agent Behavior

- **Consistency**: Maintain consistency across files and layers.
- **Clarity vs Cleverness**: Prefer clear, readable code over clever one-liners.
- **Uncertainty**: If unsure, defer to existing patterns or ask (within limits).

## 3. Definition of “Correct Work”

- Aligns with rules.
- Reduces friction.
- Respects boundaries.
- Produces deterministic outcomes.

## 4. Modification & Regression Rules

- **Preserve Functionality**: What works must keep working.
- **Regression Prevention**: You own the regression. Check your work.
- **Scope Adherence**: Don't touch unrelated files.

## 5. Missing Context Protocol

- **Assumption of Responsibility**: If documentation is missing, use "Best Industry Standard".
- **Warning System**: Warn the user (max 3 times/session) if you are making major assumptions.
- **Goal**: Never block progress.

## 6. Performance & Optimization

- **Resource Efficiency**: Always optimize for speed, scalability, and minimal resource usage (CPU/RAM).
- **Tool Utilization**: Proactively leverage tools like Redis/BullMQ for heavy tasks to ensure the lowest execution time.
- **Contextual Efficiency**: Adapt optimization strategies to the specific task and project context, favoring the most efficient solution.


