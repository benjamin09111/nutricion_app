Estructurar la ficha nutricional como un wizard con navegación lateral, pero priorizando UX/UI clínica: no mostrar todos los cálculos en bloque, sino organizarlos en cards, resumen visible y detalles expandibles.

Orden recomendado del wizard:

1. Identificación
2. Objetivos y actividad
3. Antropometría y cálculos
4. Anamnesis general
5. Anamnesis nutricional
6. Resumen final

---

## 1. Identificación

Objetivo UX: capturar datos mínimos del paciente y activar condiciones especiales.

Inputs principales:

* Nombre completo
* Email
* Teléfono
* Fecha de nacimiento
* RUT
* Sexo biológico

Cálculos automáticos:

* Edad

Condición especial:
Si sexo biológico = Femenino, mostrar:

* ¿Está embarazada?

Si está embarazada = sí, mostrar:

* Semanas de gestación
* Peso pregestacional
* Tipo de embarazo: único / múltiple / no especificado

Regla UX:
No mostrar cálculos nutricionales en esta sección. Solo mostrar una pequeña badge de estado, por ejemplo:

* “Modo gestante activo”
* “Datos gestacionales incompletos”

Si faltan semanas o peso pregestacional, mostrar:
“Para activar la evaluación gestacional completa, ingresa semanas de gestación y peso pregestacional.”

---

## 2. Objetivos y actividad

Objetivo UX: recopilar datos que afectan el cálculo energético antes de llegar a Antropometría.

Inputs:

* Foco nutricional

  * Bajar peso
  * Mantener peso
  * Subir peso
  * Ganancia muscular
  * Control gestacional
  * Patología
  * Otro

* Metas fitness

  * Salud general
  * Rendimiento deportivo
  * Recomposición corporal
  * Aumento de masa muscular
  * Reducción de grasa
  * No aplica

* Nivel de actividad física

  * Sedentario
  * Ligero
  * Moderado
  * Activo
  * Muy activo

* Restricciones dietéticas

  * Diabetes
  * Resistencia a la insulina
  * Celiaquía
  * Hipertensión
  * Alergias alimentarias
  * Vegetarianismo/veganismo
  * Otra

Regla UX:
El nivel de actividad debe guardarse antes de calcular GET/TDEE en Antropometría.

Si el paciente está embarazada, sugerir automáticamente “Control gestacional” como foco nutricional, pero permitir cambiarlo.

---

## 3. Antropometría y cálculos

Objetivo UX: pedir medidas corporales y mostrar cálculos automáticos de forma clara, separando paciente estándar y paciente gestante.

Inputs principales:

* Peso actual en kg
* Altura en cm

Inputs opcionales en acordeones:
Acordeón 1: Pliegues cutáneos

* Tricipital
* Bicipital
* Subescapular
* Suprailiaco

Acordeón 2: Perímetros y mediciones complementarias

* Altura de rodilla
* Circunferencia pantorrilla
* Circunferencia braquial
* Circunferencia cintura
* Circunferencia cadera

Regla UX:
Los campos opcionales no deben ocupar espacio principal. Deben estar colapsados por defecto.

---

## 3A. Vista para paciente estándar no gestante

Mostrar arriba una card resumen con 4 métricas principales:

Card resumen:

* IMC actual
* Clasificación nutricional
* GET estimado
* Calorías objetivo

Debajo, mostrar cards secundarias:

Card “Peso saludable”

* Rango de peso saludable
* Peso objetivo si aplica
* Nota: no mostrar este panel en modo gestante.

Card “Requerimiento energético”

* TMB/BMR
* Fórmula usada, por ejemplo Mifflin-St Jeor
* Factor de actividad
* GET/TDEE

Card “Macronutrientes”

* Calorías
* Proteínas en g/día
* Carbohidratos en g/día
* Grasas en g/día
* Porcentaje de distribución

Card “Composición corporal opcional”
Solo mostrar si hay pliegues suficientes.

* Suma de pliegues
* % grasa estimado si aplica
* Masa grasa
* Masa libre de grasa

Card “Perímetros”
Solo interpretar si hay datos suficientes.

* Cintura
* Cadera
* Relación cintura/cadera
* Relación cintura/altura

---

## 3B. Vista para paciente gestante

Si la paciente está embarazada y tiene semanas de gestación + peso pregestacional, activar Modo Gestante.

En Modo Gestante, ocultar:

* Peso ideal
* Objetivo IMC 21.5
* Rango de peso saludable adulto general
* Interpretación cardiometabólica automática de cintura/cadera
* Diagnóstico automático por pliegues como métrica principal

Mostrar una card superior llamada “Evaluación gestacional” con:

Card principal:

* IMC actual
* Semana gestacional
* Clasificación gestacional según curva MINSAL/Atalah
* Trimestre

Card “Estado nutricional inicial”

* Peso pregestacional
* IMC pregestacional
* Clasificación inicial

Card “Ganancia de peso”

* Peso pregestacional
* Peso actual
* Ganancia actual
* Rango de ganancia total recomendado según estado nutricional inicial
* Ganancia semanal recomendada desde el segundo trimestre
* Ganancia restante estimada

Ejemplo:

* Ganancia actual: +2.5 kg
* Rango recomendado total: 10–13 kg
* Ganancia restante estimada: 7.5–10.5 kg
* Ganancia semanal desde 2.º trimestre: 330–420 g/semana

Card “GET con ajuste gestacional”
Mostrar el texto de forma explícita:
“GET estimado sin incremento por embarazo: X kcal/día.”
“1.er trimestre: +0 kcal.”
“Requerimiento final estimado: Z kcal/día.”

Para segundo trimestre:
“GET estimado sin incremento por embarazo: X kcal/día.”
“2.º trimestre: +300–350 kcal.”
“Requerimiento final estimado: X+300 a X+350 kcal/día.”

Para tercer trimestre:
“GET estimado sin incremento por embarazo: X kcal/día.”
“3.er trimestre: +350–450 kcal.”
“Requerimiento final estimado: X+350 a X+450 kcal/día.”

Card “Macronutrientes”
Recalcular macros con base en el requerimiento final, no con el GET base.
Mostrar:

* Calorías finales
* Proteína g/día
* Carbohidratos g/día
* Grasas g/día
* Distribución porcentual
* Proteína en g/kg si está disponible

Card “Alertas gestacionales”
Mostrar solo si aplica:

* Datos gestacionales incompletos
* Ganancia de peso aparentemente baja para la semana
* Ganancia de peso aparentemente alta para la semana
* Embarazo múltiple: requiere referencia específica
* Requiere validación profesional

Texto fijo visible:
“Cálculo orientativo. Debe ser validado por nutricionista, matrona o médico tratante.”

Regla UX:
El modo gestante debe sentirse como una evaluación especial, no como una adaptación del panel adulto. Debe tener título propio, icono/badge y cards específicas.

---

## 4. Anamnesis general

Objetivo UX: recopilar contexto clínico y de estilo de vida.

Inputs:

* Ocupación
* Horario laboral
* Fármacos / medicamentos actuales
* Suplementos
* Drogas si aplica
* Patologías diagnosticadas
* Antecedentes familiares relevantes
* Calidad de sueño
* Estrés percibido
* Actividad física real semanal

Regla UX:
Usar campos de texto grandes para medicamentos, patologías y observaciones. Permitir tags rápidos para patologías frecuentes.

---

## 5. Anamnesis nutricional

Objetivo UX: entender hábitos alimentarios y preferencias.

Inputs:

* Frecuencia de consumo por grupos de alimentos
* Recordatorio de 24 horas
* Horarios de comida
* Número de comidas al día
* Consumo de agua
* Consumo de alcohol
* Consumo de bebidas azucaradas
* Gustos y preferencias
* Alimentos rechazados
* Presupuesto alimentario aproximado
* Quién cocina
* Dónde come normalmente
* Observaciones clínicas / resumen clínico

Para gestantes, agregar checklist opcional:

* Náuseas/vómitos
* Acidez/reflujo
* Estreñimiento
* Antojos/aversiones
* Suplementación indicada
* Hierro
* Ácido fólico
* Calcio
* Vitamina D
* Omega-3/DHA
* B12 si aplica

Regla UX:
No convertir esta sección en una pantalla gigante. Usar subsecciones:

* Hábitos
* Recordatorio
* Preferencias
* Síntomas/observaciones
* Suplementación

---

## 6. Resumen final

Objetivo UX: mostrar una vista limpia antes de guardar o generar plan.

Mostrar una pantalla final con:

Card “Datos del paciente”

* Nombre
* Edad
* Sexo biológico
* Condición especial si aplica

Card “Estado nutricional”
Si no gestante:

* IMC
* Clasificación
* Peso saludable
* GET
* Calorías
* Macros

Si gestante:

* Semana gestacional
* Trimestre
* IMC pregestacional
* Clasificación inicial
* IMC actual gestacional
* Clasificación gestacional
* Ganancia actual
* Rango de ganancia recomendado
* GET base
* Ajuste gestacional
* Requerimiento final
* Macros recalculados

Card “Objetivo”

* Foco nutricional
* Metas
* Actividad física
* Restricciones relevantes

Card “Alertas”
Mostrar solo si hay alertas:

* Datos incompletos
* Patologías relevantes
* Embarazo
* Medicamentos
* Suplementos
* Restricciones alimentarias

Botones finales:

* Guardar ficha
* Guardar y crear plan alimentario
* Exportar resumen
* Volver a editar

---

## Reglas generales de UX/UI

1. No mostrar más de 4 métricas principales al mismo tiempo en la parte superior.
2. Usar cards para separar información.
3. Usar acordeones para datos opcionales.
4. Usar badges para estados:

   * Gestante
   * Adulto mayor
   * Menor de edad
   * Datos incompletos
   * Requiere revisión
5. No mostrar cálculos que no aplican al tipo de paciente.
6. En gestantes, ocultar “peso ideal” y “objetivo IMC”.
7. En gestantes, no interpretar cintura/cadera ni pliegues como diagnóstico principal.
8. Mostrar siempre la fórmula o referencia usada en un texto pequeño expandible.
9. Mostrar disclaimer clínico en módulos con cálculos automáticos.
10. Priorizar claridad: primero resultado, luego detalle técnico.

---

## Estructura visual recomendada para Antropometría

Arriba:

* Inputs: peso y altura

Debajo:

* Card resumen principal

Luego:

* Tabs o cards según tipo de paciente

Para no gestante:

1. Estado nutricional
2. Energía y macros
3. Peso saludable
4. Opcionales

Para gestante:

1. Evaluación gestacional
2. Ganancia de peso
3. Energía y macros gestacionales
4. Opcionales no diagnósticos

Finalmente:

* Disclaimer
* Botón “Continuar”

---

## Lógica condicional principal

Si isPregnant = true y pregnancyWeeks + pregestationalWeight existen:

* Activar modo gestante completo.
* Ocultar peso ideal general.
* Calcular IMC pregestacional.
* Calcular clasificación inicial.
* Calcular IMC actual gestacional según semana.
* Calcular ganancia actual.
* Calcular ganancia recomendada.
* Calcular trimestre.
* Calcular ajuste calórico por trimestre.
* Recalcular macros con requerimiento final.

Si isPregnant = true pero faltan datos:

* Mostrar modo gestante incompleto.
* Pedir semanas y peso pregestacional.
* No mostrar clasificación gestacional completa.

Si isPregnant = false:

* Usar flujo estándar.
* Mostrar IMC adulto, infantil/adolescente o adulto mayor según edad.
* Mostrar peso saludable y GET estándar.

---

## Resultado esperado

La interfaz debe sentirse clínica, ordenada y fácil de usar. El usuario no debe tener que interpretar una lista larga de cálculos. La app debe mostrar primero lo importante, esconder lo técnico en detalles expandibles y cambiar automáticamente la experiencia según el tipo de paciente.
