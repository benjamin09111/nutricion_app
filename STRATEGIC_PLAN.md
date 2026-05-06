# NutriNet Strategic Core Improvement Plan (The "Antigravity" Vision)

Este documento define la hoja de ruta para que NutriNet no solo reemplace, sino que **supere y revolucione** el flujo de trabajo tradicional basado en PDFs estáticos. El objetivo es proporcionar una herramienta dinámica, rápida y altamente personalizada para el paciente.

## 1. El Déficit del Modelo Actual
Muchos nutricionistas trabajan con un sistema de **Intercambio de Porciones**. El paciente no tiene un menú rígido, sino una estructura (ej: "1 Porción de Cereal") y una lista de opciones equivalentes (Avena, Pan, Galletas). 
*   **Problema**: Nuestra app actual es "Ingrediente-Primero" (seleccionas el alimento y luego ves cuánto aporta).
*   **Solución**: Evolucionar a un modelo "Estructura-Primero" apoyado por inteligencia de equivalentes.

## 2. Propuesta de Mejora por Módulos

### Módulo Dieta (La Estrategia)
*   **Objetivo**: Definir el "Esqueleto" nutricional.
*   **Mejora**: Añadir una sección de **"Metas por Tiempo de Comida"**. El nutri define que el Desayuno debe tener 1 Cereal, 2 Proteínas, 1 Grasa.
*   **Automatización**:
### 🛠️ Fases de Implementación (Core Engine)

#### Fase 1: Dieta (The Strategy)
- [x] Estructura base de Dieta (CRUD).
- [x] Restricciones Clínicas dinámicas.
- [x] Lógica de Inclusión/Exclusión.
- [x] Tags de Clasificación.

#### Fase 2: Fitness & Suplementos (The Booster) - [NEW 🆕]
- [ ] Módulo dedicado para Rutinas de Entrenamiento (PDF Parsing).
- [ ] Power Drawer de Suplementos (Whey, Creatina, etc.).
- [ ] Integración con Gaps Nutricionales.

#### Fase 3: Carrito (The Quantifier)
- [x] Conversión de Estrategia a Unidades Reales.
- [x] Lógica de Frecuencia Semanal.
- [x] Cálculo de Porciones de Intercambio (UDD) - **Bidireccional**.
- [x] Selector de Equivalentes dinámico.

Al seleccionar una restricción (ej: Celiaco), el sistema no solo filtra alimentos, sino que sugiere los reemplazos de porción equivalentes sin gluten.

### Módulo Carrito (El Cuantificador)
*   **Objetivo**: Convertir la estrategia en compra tangible.
*   **Mejora**: Integrar el **Selector de Equivalentes**. Si el nutri elige "Pan Integral", el sistema debe mostrar automáticamente: "Equivale a 40g de Avena o 3 Galletas". 
*   **Fidelidad**: Permitir que el nutri elija varias opciones para un mismo bloque de porción para que el paciente tenga variedad.

### Módulo Recetas (La Implementación)
*   **Objetivo**: El "Cómo comer".
*   **Mejora**: Generación de **Menús Dinámicos**. En lugar de "Desayuno: Avena", el PDF debe decir "Desayuno: Elige 1 Opción de Cereal + 2 de Proteína" y listar las recetas/alimentos que cumplen eso.
*   **Comodines de Emergencia**: Sugerencia automática de platos rápidos para días sin tiempo, usando lo que ya está en el Carrito.

### Módulo Fitness & Suplementos (El Optimizador)
*   **Objetivo**: Cerrar brechas nutricionales.
*   **Mejora**: El "Cajón de Suplementos" (persistente). Si el sistema detecta que falta proteína para llegar a la meta del paciente, el IA sugiere: "¿Agregar 1 scoop de Whey en el Desayuno?".
*   **Integración**: Los suplementos se suman a los totales nutricionales y a la lista de compra de forma fluida.

## 3. El Entregable (El Producto Final)
*   **Visualización Premium**: El PDF debe dejar de ser una lista y convertirse en una **Guía de Estilo de Vida**.
*   **Estructura Sugerida**:
    1.  Contexto y Metas del Paciente.
    2.  Checklist de Hábitos y Notas Emocionales.
    3.  **La Estructura Diaria (Porciones)**.
    4.  **Tablas de Intercambio (Equivalentes)** -> "Si no quieres X, come Y".
    5.  Recetas Detalladas.
    6.  Lista de Compra Organizada.

## 4. IA & Automatización (Próximos Pasos)
*   **Lectura de PDFs**: Implementar un agente que pueda "leer" los apuntes viejos del nutri (como el snippet enviado) y mapearlos automáticamente a nuestra estructura de Dieta/Carrito.
*   **Generación Proactiva**: El IA no solo genera la receta, sino que optimiza el costo basándose en los precios de supermercados chilenos (Lider/Jumbo/etc).

---
**Resultado Esperado**: Una herramienta que ahorra al nutricionista el 80% del tiempo de cálculo manual y entrega al paciente un plan profesional, flexible y estéticamente superior.
