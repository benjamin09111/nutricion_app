# NutriSaaS - Especificaciones del Proyecto

Este documento define la estructura y funcionalidad de la aplicación NutriSaaS, basada en los requerimientos del usuario.

## Visión General
NutriSaaS es una plataforma integral para nutricionistas que combina gestión de pacientes, creación inteligente de dietas mediante IA y algoritmos de optimización, y herramientas de educación y engagement.

## Módulos del Sistema

### 1. Generación de Dietas Basada en Restricciones y Análisis
**Descripción:** Motor de procesamiento que crea planes de alimentación personalizados.
- **Funcionalidades Clave:**
  - Ingesta de restricciones médicas (diabetes, alergias, metas).
  - Integración con LLM para procesar archivos PDF existentes (planes anteriores).
  - Sugerencia de alimentos cumpliendo estrictamente macros.
  - Edición manual por ítem y asignación de sustitutos inteligentes.
  - **Tecnología sugerida:** Python (PuLP/Pandas) para optimización estricta, LLM para parsing.

### 2. Conversión a Lista de Supermercado Inteligente
**Descripción:** Transforma planes dietéticos en listas de compra accionables.
- **Funcionalidades Clave:**
  - Agrupación por categorías (pasillo de super).
  - Cálculo de cantidades totales para el periodo.
  - Estimación de precios (base de datos de mercado).
  - Uso de "Listas Base" (plantillas) restables.

### 3. Sistema de Priorización de Alimentos Favoritos
**Descripción:** Lógica de recomendación preferencial.
- **Funcionalidades Clave:**
  - Marcado de alimentos "Favoritos" o "Recomendados" por el nutricionista.
  - Priorización en algoritmos de generación automática.
  - Respeto de restricciones médicas por encima de preferencias.

### 4. Automatización de Tabla de Composición Química
**Descripción:** Gestión de integridad de datos nutricionales.
- **Funcionalidades Clave:**
  - Mapeo de ingredientes a fichas técnicas (calorías, macros, micros).
  - Recálculo automático del total dietético al cambiar ingredientes.
  - Single Source of Truth para datos químicos.

### 5. Gestión Integral de Perfiles de Pacientes (CRM Nutricional)
**Descripción:** Núcleo de datos del paciente.
- **Funcionalidades Clave:**
  - Almacenamiento de antropometría, historial, preferencias.
  - Vinculación histórica de dietas y listas.
  - Contexto para el Chatbot (Module 11).

### 6. Motor Creativo de Generación de Platos
**Descripción:** Transformación de ingredientes en recetas atractivas.
- **Funcionalidades Clave:**
  - Clasificación por estilo (Económico, Gourmet, Rápido).
  - Timing nutricional (cuándo comer).
  - Cálculo de calorías por porción.
  - Enfoque en adherencia y experiencia culinaria.

### 7. Optimizador de Horarios y Estilo de Vida
**Descripción:** Sincronización de ingesta con rutina diaria.
- **Funcionalidades Clave:**
  - Análisis de rutina (sueño, entrenamiento, trabajo).
  - Recomendación de ventanas de alimentación.
  - Distribución de carga energética óptima.

### 8. Generador de Guías Prácticas y Educación Visual
**Descripción:** Output visual para el paciente.
- **Funcionalidades Clave:**
  - Compilación de plan en formato atractivo (tipo Infografía/Canva).
  - Sección educativa integrada (Mitos, FAQ).
  - Formato breve y claro.

### 9. Conector de E-commerce (Futuro)
**Descripción:** Integración con supermercados.
- **Funcionalidades Clave:**
  - Mapeo de lista a carritos de compra online.
  - Selección de marcas disponibles.
  - **Tecnología Sugerida**: n8n para scraping de precios y conexión APIs externas.

### 10. Catálogo Maestro de Alimentos y Filtros
**Descripción:** Base de datos central curada por el nutricionista.
- **Funcionalidades Clave:**
  - Etiquetado exhaustivo (Vegano, Gluten-Free, etc.).
  - Filtros personalizados por nutricionista (ocultar/mostrar alimentos).
  - El agente solo sugiere alimentos permitidos por el filtro activo.

### 11. Asistente 24/7 y Automatización de Engagement
**Descripción:** Chatbot y sistema de retención.
- **Funcionalidades Clave:**
  - Chatbot WhatsApp para dudas frecuentes.
  - Flujo "Push" para recordatorios y motivación.
  - Personalización basada en el historial del paciente.
  - **Tecnología Sugerida**: n8n para flujos de conversación y triggers de WhatsApp.
