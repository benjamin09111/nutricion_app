# Memoria del Agente Desarrollador

Este archivo es la memoria persistente del agente. Se lee al inicio de cada sesion y se escribe automaticamente cuando el agente aprende algo nuevo.

---

## Correcciones del Usuario
- **Modo Gestante Incompleto**: Habilitar el flujo antropométrico de embarazo sin peso pregestacional (solo calculando IMC y trimestre, sin curvas de ganancia ni alertas de peso).
- **Sexo biológico obligatorio**: Requerir sexo biológico siempre que se calculen métricas energéticas o curvas antropométricas (como GET).
- **Embarazo múltiple**: Omitir curvas de peso recomendadas estándar e informar alerta de validación clínica.
- **Creación rápida**: Habilitar pestaña abreviada para registrar pacientes solo con Nombre, Email, Sexo, Teléfono y Motivo de consulta.

---

## Preferencias del Usuario

- **Ejecucion secuencial**: prefiere fases completas antes de pasar a la siguiente, no trabajo en paralelo
- **SSE para streaming**: Server-Sent Events sobre WebSocket para el chat del copiloto
- **Reemplazo directo**: modificar codigo existente en vez de crear nuevas abstracciones en paralelo
- **Escritura automatica en memory.md**: el agente escribe sin pedir permiso. Para otros archivos (.agents/rules/, patterns.md, etc.) pregunta primero
- **Alcance total de .agents/**: el agente puede usar todo el contenido de .agents/ incluyendo skills/
- **Contenido inicial pragmatico**: prefiere empezar con anti-patrones genericos y luego refinar con experiencia real
- **Interes principal**: que el agente no olvide correcciones ni errores. memory.md es la prioridad #1
- **Nombre del agente**: "Antigravity"

---

## Errores Cometidos (NO repetir)
- **Campos fantasma**: No dejar que el estado gestacional persista si el sexo cambia a Masculino u Otro. Limpiar las variables del formulario inmediatamente.
- **Colores fuera de paleta**: Usar SOLO los hex de la paleta definida en `globals.css`. Nunca usar colores Tailwind genéricos (green-500 `#22c55e`, etc.). Los únicos válidos son los brand colors del proyecto: Emerald `#8da84f` (600) / `#74853f` (700) / `#f7fbe8` (50), Indigo `#8f70d8` (600). Para el resto (Amber, Orange, Rose) usar Tailwind defaults con moderación.

---

## Decisiones de Arquitectura

### 2026-07-06 — Sistema de Agentes Dual
- Dos tracks independientes: Track A (agente desarrollador, .agents/) y Track B (Copiloto Clinico, producto)
- Track A completado: agents.md + memory.md + rules/development.md + rules/design.md + feedback.md + evolution/* + entrypoint.md + map/files.md
- Pendiente: Track B (AI SDK + ToolLoopAgent + frontend chat)
- agent-rules.md marcado como DEPRECATED, absorbido por agents.md

### 2026-07-08 — Arquitectura de Formulario Dual y Control de Estados
- Implementación de pestañas (Tabs) en creación de pacientes con dos `useForm` independientes y dos esquemas Zod (`quickPatientSchema` y `patientFormSchema`) para prevenir colisión de validaciones en campos omitidos.
- Inyección automática de `evaluationDate` en todas las variables personalizadas creadas.
- **Desactivación de eliminación física**: Eliminados permanentemente los botones de eliminación definitivos de la interfaz de pacientes. Se forza un estado inactivo ("Soft Delete") utilizando únicamente el interruptor de estado (Active/Inactive), previniendo pérdida accidental de datos históricos.
- **Validación estricta de teléfono**: Todo teléfono ingresado (sea en creación rápida o detallada) exige un mínimo de 9 dígitos numéricos si no se deja vacío.
- **Desglose de Conteo en UI**: El totalizador de pacientes se cambió a "X activos, Y inactivos. Total: Z" en la UI de PatientsClient.
- **Tablas de Referencia Gestacionales**: Separación limpia entre curvas MINSAL/Atalah e IOM. Se inyecta la referencia de peso "minsal_atalah" de forma explícita y se muestra "Referencia: MINSAL/Atalah Chile" en el Monitoreo de Ganancia de Peso.
- **Preprocesamiento Zod de Arrays**: Inyección de `z.preprocess` para asegurar que arrays opcionales (restricciones, síntomas, suplementos) se conviertan de forma segura a `[]` si se omiten, evitando errores de validación de tipo ("Invalid input").

### 2026-07-08 — Rediseño Vista Detalle Paciente (COMPLETADO 2026-07-07)
- **PatientDetailClient**: Hero sticky con identidad (nombre, sexo, edad, RUT, email, teléfono), chips de cálculos (IMC, GET, peso/talla, actividad), 4 cards de resumen (Estado nutricional, Requerimiento energético, Macronutrientes, Alertas), navbar de tabs. Menú 3-puntos con Pausar seguimiento, Exportar ficha, Eliminar paciente.
- **PatientFichaClinicaTab**: Acordeones con Datos personales, Antropometría básica, Anamnesis general, Anamnesis nutricional, Cálculos técnicos (colapsado), Mediciones avanzadas (colapsado), Objetivo clínico.
- **Tabs**: Ficha clínica, Evaluaciones, Progreso, Planes alimentarios, Exámenes (disabled), Acompañamiento.
- **Vista gestante**: Cards especiales cuando isPregnant=true en clinical record.
- **Validaciones**: Alertas por datos faltantes y valores antropométricos improbables.
- **Colores IMC corregidos**: `BMI_CLASSIFICATIONS` usa brand colors del proyecto: Indigo `#8f70d8`, Emerald `#8da84f` (mismo que botón "Nueva evaluación"), Amber `#d97706`, Orange `#ea580c`, Rose `#e11d48`/`#be123c`.
