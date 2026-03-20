# NutriSaaS: Plataforma Integral para Nutricionistas

NutriSaaS es una plataforma diseñada para digitalizar, agilizar y potenciar la consulta nutricional, desde la gestión de historiales clínicos hasta la generación automatizada y personalizada de planes de alimentación y listas de compra. Desarrollada con un enfoque "Nutri-First", la plataforma disminuye la carga cognitiva de los cálculos manuales y emite documentos profesionales con base en inteligencia algorítmica y catálogos de precios actualizados (enfoque inicial en Chile).

---

## 🏗️ Stack Tecnológico

La plataforma opera bajo el patrón de **Modular Monolith** enfocando la separación limpia en capas de dominio:
- **Frontend:** Next.js 16 (App Router), React, TypeScript, TailwindCSS, Componentes de Shadcn/UI.
- **Backend:** NestJS, TypeScript.
- **Base de Datos:** PostgreSQL a través de Prisma ORM. Utiliza modelos híbridos: Tablas regulares para estructura fuerte (Relaciones, Auth) y `JSONB` para elementos dinámicos (Dietas, Listas de compras, Preferencias Custom).
- **Reglas de Calidad:** Arquitectura Event-Driven para abstraer tareas pesadas (generación de PDFs y cálculos), diseño Thin Backend (Backends delegados), y Big O optimizado para prevenir consultas N+1.

---

## ⚙️ El Motor "Core": Flujo de 4 Etapas

El corazón de la aplicación es la creación fluida del plan nutricional. Aunque operan juntos en el flujo común, **cada uno de los módulos es independiente**. 
Puedes usarlos de forma lineal y ligada a un paciente, o usarlos como herramientas desconectadas (ej. Sólo armar una dieta general rápida, o sólo imprimir un recetario sin depender de un historial clínico).

El ciclo principal consta de 4 módulos o agentes interconectados:

### 1. Etapa 1: Dieta (The Strategy)
Creación de **plantillas base (Templates)**. 
Aquí el nutricionista configura las restricciones mayores (P.ej. Dieta Vegana, Alta en Proteínas, Celiaco, Sin Lactosa). Son **Bases Estratégicas** y excluyen componentes alérgicos, indicando un grupo general de alimentos permitidos.
- **Auto-Mapping Educativo:** Al seleccionar un check (ej. Diabético), el sistema prepara en formato background los componentes de educación sobre la diabetes correspondientes.

### 2. Etapa 2: Carrito (The Quantifier)
Convertimos la "Estrategia" en tangibles.
El sistema carga el perfil biométrico del paciente (Edad, Sexo, Peso, Meta deportiva) y cuantifica los requerimientos mensuales o semanales utilizando un **Weekly Frequency Model** (Frecuencia Semanal) para alimentos (ej. "Pollo 3 veces/semana").
- **Híbrido de Cálculos:** Visualización en tiempo real de Macros (Kcal, Proteínas, Grasas) evaluados con semáforos de advertencia.
- **Inteligencia de Precios & Suplementos:** Sistema proactivo para cubrir déficits. Sugiere intercambios por precio (precios locales chilenos) y adición de suplementos al detectarlo.

### 3. Etapa 3: Recetas / Platos (The Implementation)
Una vez listo y validado el carrito, el sistema cruza los ingredientes comprados contra un cronograma de tiempo (Desayuno, Almuerzo, Cena, Snack). 
- Crea calendarios específicos u opciones modulares ("Jokers") para cada momento del día sin cruzar la barrera calórica establecida en el Carrito. Las recetas son visuales y fáciles de cocinar.

### 4. Etapa 4: Entregable (The Product - PDF)
El documento PDF final. Un entregable interactivo y pulido. 
Antes de comenzar a personalizar este documento, el nutricionista puede elegir entre dos flujos gracias a la independencia de los módulos:

- **Flujo Paciente (Dependiente):** Importar automáticamente a un paciente (si venía arrastrado desde etapas previas) junto a su dieta, carrito y recetas calculadas.
- **Flujo General (Independiente):** Desarrollar un PDF generérico e independiente. Aquí el usuario recopila piezas como si armara legos: Selecciona información relevante, importa "Creaciones" que haya guardado previamente en su catálogo (Carga un carrito modelo, una plantilla de recetas, etc.) y añade portadas. Ideal para armar planes genéricos, ebooks, guías para RRSS o retos.

Sin importar el flujo, el Entregable:
- Une la Pauta de Nutrición (Recetas) + La Lista del Supermercado (Carrito) + Consejos de Hábitos / Mitos de los *Recursos* de la librería.
- Soporta branding del profesional y formatos adaptables al tono ("Vibe") del nutri (Empático, Clínico, Directo).
- Integra código QR para inyectar automáticamente el Carrito al supermercado aliado en un futuro.

---

## 📂 Visión General de Módulos (Domain Modules)

### 1. Pacientes y Consultas (CRM)
- Centralización de los datos clínicos de usuarios, historial, etiquetas y el motor del flujo.
- Capacidad de aislar restricciones médicas vs. etiquetas libres. 
- Creación de perfiles base desde los que inician los cálculos metabólicos.

### 2. Alimentos & Sustitutos
- Catálogo global de alimentos pre-ingresados (Sistema) junto a sus precios promedio, aporte de macros y micronutrientes, con capacidad de filtrado avanzado.
- *Mis Creaciones:* Capacidad del nutri para crear ingredientes faltantes o customizados de marcas específicas y combinarlos en sus planes.
- Capacidad de encontrar *Sustitutos* dinámicos ante falta de stock y variaciones calóricas por inflación.

### 3. Mis Creaciones (El Dashboard de Artifacts JSON)
- Espacio donde residen todos los artefactos creados (Las "Bases De Dieta", "Listas de Supermercado Guardadas", "Recetarios Base").
- Todos estos operan basándose en la inyección de `JSON` dinámico para garantizar flexibilidad técnica ilimitada a lo largo del tiempo sin requerir migraciones complejas de SQL constantes.

### 4. Recursos Educativos y Soporte (Knowledge Base)
- Biblioteca comunitaria o personal del nutri.
- Artículos con editor en formato *Rich Text (Word-like visual editor)* orientados a consejos prácticos, manejo de hambre emocional, o guías rápidas de preparación (Meal Prep). 
- Utilizados como anexos al Entregable de pacientes para darles un trato integral y humano.

### 5. Configuración y Panel Super-Admin
- **Control para Nutricionistas:** Manejo de la consulta (Logo de la clínica, horarios, tono de lenguaje, sistema de Token).
- **Super Admin (Antigravity):** Interfaz para manejar a los nutricionistas clientes (Roles, Peticiones de Ingreso, Facturación/Suscripciones SaaS, Analíticas Financieras MRR, Reportes Integrales de Soporte & Feedback Módulo).

---

## 📌 Protocolos y Reglas de Integridad Críticas
- **Conservación Estricta:** Las consultas, métricas y data financiera bajo *Event Sourcing*. No se borran interacciones cruzadas; en lugar de eso se utilizan eliminaciones lógicas (`status = inactive`) o eventos auditables preventivamente para proteger la información real.
- **Optimización en UX (UI consistency):** El sistema favorece flujos y clics predecibles sobre interacciones invasivas. Evitamos elementos como `window.confirm` usando sistemas Modales en todos los puntos críticos (ej. `ConfirmationModal`), dando a los profesionales de la salud resiliencia y seguridad sobre la posible pérdida de su trabajo.
- **Automatización Colaborativa AI:** Soporte determinístico en donde el flujo algorítmico hace el 80% (generación bruta de requerimientos), pero el agente humano siempre debe revisar, editar y dar luz verde para asegurar el *Clinical Judgment* definitivo.
