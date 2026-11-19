La clave es que no parezcan cinco módulos independientes: deben contar la historia de un mismo paciente antes, durante y después de su consulta.

Cada pantalla debe demostrar algo que NutriNet hace, no solamente que se ve bonita.

1. Dashboard clínico + ficha del paciente
   ANTES DE LA CONSULTA
   Prioridad de desarrollo: Alta

Objetivo: demostrar que NutriNet elimina la fragmentación centralizando la información clínica, administrativa y de seguimiento.
Debe contener:

- Panel principal: consultas del día, pacientes activos, controles próximos y tareas pendientes.
- Ficha del paciente: datos generales, edad, antecedentes, alergias, restricciones y objetivos nutricionales.
- Resumen antropométrico: peso, IMC, evolución y fecha de última evaluación.
- Historial clínico: consultas anteriores, pautas entregadas, archivos compartidos y preguntas respondidas.
- Acciones rápidas: crear evaluación, generar pauta, consultar historial y contactar al paciente.
- Indicador de seguimiento: última interacción, próximo control y tareas sin resolver.
  Diferenciación que debemos mostrar:

El profesional no tiene que abrir Excel, buscar un correo o revisar múltiples conversaciones para recuperar el contexto del paciente.

Elemento visual imprescindible: una ficha con una línea de tiempo que demuestre que NutriNet conserva el historial de cada atención.

INSTRUCCIÓN PARA TU AGENTE

Diseñar un dashboard clínico SaaS de alta calidad visual, con navegación lateral compacta, tarjetas informativas sobrias y una ficha de paciente abierta. Priorizar jerarquía visual, legibilidad y navegación intuitiva. La pantalla debe comunicar centralización de información en menos de cinco segundos.

2. Generador clínico inteligente de pautas
   DURANTE LA CONSULTA
   Prioridad de desarrollo: Crítica

Objetivo: demostrar que NutriNet crea pautas clínicas personalizadas, con información pertinente a Chile y supervisión profesional.
Debe contener:

- Wizard guiado: indicadores de los pasos de creación, mostrando claramente el progreso.
- Datos del paciente precargados: antecedentes, objetivos, restricciones, medidas y requerimientos calculados.
- Cálculos nutricionales: GET, distribución de macronutrientes, energía diaria e intercambios alimentarios.
- Base nutricional chilena: selección de alimentos y porciones con fuentes identificadas, incluyendo INTA cuando corresponda.
- Vista previa de pauta: desayuno, almuerzo, cena, colaciones y sus respectivas porciones.
- Sustitutos personalizados: alternativas alimentarias coherentes con las restricciones y preferencias.
- Recetas y lista de compras: asociadas al plan seleccionado.
- Controles profesionales: editar, regenerar parcialmente, guardar borrador y aprobar.
  Diferenciación que debemos mostrar:

No es un chatbot rellenando una plantilla. Es un proceso clínico estructurado, asistido por IA, con cálculos y alimentos locales, donde el nutricionista conserva el control.

Elemento visual imprescindible: una pauta personalizada visible junto a los requerimientos e intercambios calculados, con la acción «Revisar y aprobar».

INSTRUCCIÓN PARA TU AGENTE

Implementar una interfaz de planificación nutricional en dos zonas: formulario clínico resumido a la izquierda y vista previa editable de la pauta a la derecha. Mostrar cálculos, alimentos chilenos, sustituciones y progreso del wizard. No utilizar contenido clínico ficticio inconsistente; todos los valores visibles deben ser coherentes y el profesional debe poder corregirlos.

3. Naty — Asistente de IA contextual y especializado
   DIFERENCIACIÓN TECNOLÓGICA
   Prioridad de desarrollo: Crítica

Objetivo: demostrar que Naty no es simplemente ChatGPT integrado en NutriNet, sino un asistente que trabaja dentro del contexto clínico.
Debe contener:

- Panel lateral persistente de Naty: disponible dentro de la ficha, evaluación y planificación.
- Contexto activo: nombre del paciente ficticio, objetivo, restricciones e información autorizada que está utilizando.
- Acciones rápidas: revisar pauta, sugerir sustitutos, explicar cálculos, preparar seguimiento y resumir historial.
- Interacción demostrativa: una solicitud concreta del nutricionista, como revisar una pauta considerando los intercambios chilenos.
- Respuesta estructurada: propuesta, justificación, datos utilizados y advertencias cuando corresponda.
- Fuentes visibles: base de alimentos, tablas INTA o referencias correspondientes.
- Acciones supervisadas: aceptar sugerencia, editar, descartar y registrar cambios.
- Historial de acciones: dejar constancia de qué recomendó la IA y qué aprobó el profesional.
  Diferenciación que debemos mostrar:

Naty entiende en qué etapa del trabajo se encuentra el profesional, utiliza herramientas especializadas y puede asistirlo sin obligarlo a copiar información a otra aplicación.

Elemento visual imprescindible: una respuesta de Naty que proponga una modificación contextualizada y que el nutricionista pueda aprobar antes de aplicarla.

INSTRUCCIÓN PARA TU AGENTE

Desarrollar un asistente contextual integrado en la aplicación, no una página de chat independiente. Debe identificar el módulo y paciente activo, recuperar información autorizada, presentar acciones estructuradas y requerir confirmación para cambios clínicos. Usar herramientas deterministas para cálculos nutricionales y permitir consultar la procedencia de los datos.

4. Portal móvil del paciente
   DESPUÉS DE LA CONSULTA
   Prioridad de desarrollo: Alta

Objetivo: demostrar que la atención continúa después de que el paciente abandona la consulta.
Debe contener:

- Pantalla de bienvenida personalizada: nombre del paciente y nutricionista responsable.
- Pauta actual: organizada por comidas y fácil de consultar.
- Historial de planes y documentos: archivos anteriores y recomendaciones recibidas.
- Recetas personalizadas: ingredientes, preparación y porciones.
- Lista de compras: generada desde la planificación nutricional.
- Recursos educativos: documentos, consejos y recomendaciones compartidas.
- Mensajería formal: preguntas al nutricionista y respuestas organizadas por conversación.
- Próximo control: fecha, recordatorios y acciones pendientes.
- Registro de avances: datos que el paciente comparte voluntariamente con su nutricionista.
  Diferenciación que debemos mostrar:

En vez de recibir documentos aislados por correo o WhatsApp, el paciente dispone de un lugar donde consultar su información, mientras el profesional conserva la trazabilidad.

Elemento visual imprescindible: una pantalla móvil que muestre simultáneamente la pauta vigente, el próximo control y una conversación o recomendación del nutricionista.

INSTRUCCIÓN PARA TU AGENTE

Crear un portal PWA mobile-first para pacientes, con navegación inferior sencilla: Inicio, Mi Plan, Recursos, Mensajes y Perfil. Debe ser visualmente amigable, accesible y coherente con NutriNet, pero más simple que el panel profesional. Priorizar lectura rápida, botones claros y contenido clínico aprobado por el nutricionista.

5. Seguimiento inteligente y trazabilidad clínica
   DIFERENCIACIÓN PRINCIPAL
   Prioridad de desarrollo: Máxima

Objetivo: demostrar que NutriNet acompaña el proceso completo, no únicamente la elaboración y entrega de la pauta.

Esta es la pantalla a la que dedicaría más atención en tu pitch.
Debe contener:

- Panel de seguimiento: pacientes activos, controles pendientes, últimas interacciones y tareas por resolver.
- Línea de tiempo clínica: consultas, evaluaciones, pautas, mensajes, recomendaciones y modificaciones.
- Historial de versiones: identificar cuándo se cambió una pauta y quién aprobó el cambio.
- Indicadores de actividad: tiempo transcurrido desde última consulta, mensajes pendientes y próximos controles.
- Alertas de seguimiento: pacientes sin controles programados o con tareas pendientes.
- Alertas de posible abandono: únicamente si existe una definición y lógica verificable; no presentarlas como predicciones clínicas validadas.
- Asistencia de Naty: resumen de cambios, preguntas pendientes y propuesta de próximos pasos.
- Acciones rápidas: enviar recordatorio, responder consulta, programar control y revisar pauta.
- Control profesional: las acciones clínicas requieren revisión y aprobación.
  Diferenciación que debemos mostrar:

La información que se crea durante la consulta alimenta el seguimiento posterior y puede recuperarse en la siguiente atención.

Elemento visual imprescindible: una línea de tiempo donde se vea claramente la secuencia de una pauta aprobada, su entrega, una pregunta del paciente, la respuesta del profesional y la preparación del siguiente control.

INSTRUCCIÓN PARA TU AGENTE

Implementar una vista clínica longitudinal centrada en el paciente. Integrar una línea de tiempo con eventos persistidos, mensajes vinculados a la ficha, historial de pautas y panel de controles pendientes. Naty debe poder generar resúmenes a partir de registros existentes. Diferenciar alertas basadas en reglas de cualquier predicción de abandono; todas las acciones clínicas deben mantener trazabilidad y supervisión humana.
