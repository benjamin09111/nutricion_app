Rediseñar la vista de detalle del paciente para que no muestre todos los datos y cálculos al mismo tiempo. La pantalla debe priorizar un resumen clínico limpio, acciones principales y navegación por pestañas.

## Objetivo de la pantalla

La vista de paciente debe responder rápidamente:

1. Quién es el paciente.
2. Cuál es su estado nutricional actual.
3. Cuáles son sus requerimientos estimados.
4. Qué datos faltan o requieren revisión.
5. Qué acción puede realizar el profesional.

No debe funcionar como un formulario completo abierto ni como un panel técnico con todos los cálculos visibles.

---

## Header del paciente

Mostrar arriba:

* Nombre completo
* Estado del paciente: Activo / Inactivo
* Edad
* Sexo biológico
* Última evaluación registrada
* Datos de contacto resumidos

Ejemplo:

Benjamin Morales Pizarro
Paciente activo · 24 años · Masculino
Última evaluación: 7 jul 2026

Acciones principales:

* Nueva evaluación
* Editar paciente
* Crear plan alimentario
* Ver progreso

Acciones secundarias en menú de tres puntos:

* Pausar seguimiento
* Exportar ficha
* Eliminar paciente

No mostrar “Eliminar paciente” como acción principal visible.

---

## Resumen superior

Debajo del header, mostrar máximo 4 cards principales:

### Card 1: Estado nutricional

* Peso actual
* Altura
* IMC
* Clasificación nutricional

Ejemplo:
Peso: 65 kg
Altura: 170 cm
IMC: 22.5 kg/m²
Estado: Normopeso

No mostrar percentiles en adultos. Los percentiles solo deben mostrarse en menores de 18 años.

---

### Card 2: Requerimiento energético

* GET estimado
* Calorías finales
* Actividad física
* Ajuste profesional si existe

Ejemplo:
GET estimado: 2756 kcal/día
Actividad: Activo
Ajuste profesional: 0 kcal
Calorías finales: 2756 kcal/día

---

### Card 3: Macronutrientes

* Proteínas
* Carbohidratos
* Grasas
* Distribución porcentual

Ejemplo:
Proteínas: 138 g/día
Carbohidratos: 379 g/día
Grasas: 77 g/día
Distribución: 55% CHO · 20% Prot · 25% Grasas

---

### Card 4: Alertas y pendientes

Mostrar solo alertas útiles:

* Datos faltantes importantes
* Valores antropométricos improbables
* Sin diagnóstico nutricional profesional
* Sin objetivo definido
* Mediciones avanzadas incompletas
* Embarazo con datos gestacionales incompletos, si aplica

Ejemplo:
Pendiente: motivo de consulta
Pendiente: diagnóstico nutricional
Revisar: perímetros con valores improbables

---

## Navegación inferior por pestañas

Usar tabs para separar la información:

1. Ficha clínica
2. Evaluaciones
3. Progreso
4. Planes alimentarios
5. Exámenes
6. Acompañamiento

---

## Tab: Ficha clínica

Dentro de Ficha clínica, organizar en acordeones o cards:

### Datos personales

* Email
* Teléfono
* RUT/DNI
* Fecha de nacimiento
* Sexo
* Motivo de consulta

### Antropometría básica

* Peso
* Altura
* Peso habitual
* Peso objetivo profesional
* Actividad

### Anamnesis general

* Patologías
* Medicamentos
* Suplementos
* Sueño
* Estrés
* Ejercicio semanal

### Anamnesis nutricional

* Horarios de comida
* Número de comidas
* Agua
* Recordatorio 24 horas
* Frecuencia alimentaria
* Preferencias
* Rechazos/intolerancias

### Cálculos técnicos

Esta sección debe estar colapsada por defecto.
Mostrar:

* Fórmula usada
* TMB
* Factor de actividad
* GET
* Ajuste calórico profesional
* Calorías finales
* Referencia usada

### Mediciones avanzadas

Esta sección debe estar colapsada por defecto.
Mostrar solo si existen datos válidos:

* Pliegues cutáneos
* Perímetros
* Chumlea
* Frisancho
* Riesgo cardiovascular

Si no hay datos suficientes, no mostrar campos vacíos con guiones. Mostrar un mensaje breve:
“No hay mediciones avanzadas suficientes para calcular esta sección.”

---

## Reglas de visualización

1. No repetir el mismo cálculo en varias zonas de la pantalla.
2. No mostrar campos vacíos como “---” en el resumen principal.
3. Ocultar Chumlea, Frisancho, pliegues y perímetros en la vista principal.
4. Mostrar percentiles solo en menores de 18 años.
5. En adultos, mostrar clasificación IMC OMS.
6. En adultos mayores, mostrar clasificación correspondiente a adulto mayor.
7. En gestantes, reemplazar el resumen estándar por resumen gestacional.
8. Mostrar botón “Eliminar paciente” solo en menú secundario o zona de peligro.
9. Mostrar “Revisión profesional requerida” como nota secundaria, no como alerta roja permanente.
10. Mostrar fórmulas y detalles técnicos solo en una sección expandible llamada “Ver desglose técnico”.

---

## Validaciones adicionales

Agregar validaciones para valores improbables:

* Altura rodilla menor a 35 cm o mayor a 70 cm: advertencia.
* Circunferencia pantorrilla menor a 20 cm o mayor a 70 cm: advertencia.
* Circunferencia braquial menor a 15 cm o mayor a 60 cm: advertencia.
* Circunferencia cintura menor a 40 cm o mayor a 200 cm: advertencia.
* Circunferencia cadera menor a 50 cm o mayor a 200 cm: advertencia.
* Pliegues menores a 2 mm o mayores a 80 mm: advertencia.
* Peso menor a 20 kg o mayor a 500 kg: bloqueo o advertencia fuerte.
* Altura menor a 50 cm o mayor a 260 cm: bloqueo o advertencia fuerte.

Valores improbables no deben alimentar cálculos automáticos hasta ser confirmados por el profesional.

---

## Vista gestante

Si el paciente está en modo gestante, la vista principal debe cambiar:

### Card 1: Evaluación gestacional

* Semana gestacional
* Trimestre
* IMC actual gestacional
* Clasificación Atalah

### Card 2: Ganancia de peso

* Peso pregestacional
* Peso actual
* Ganancia actual
* Rango recomendado
* Ganancia restante

### Card 3: Energía gestacional

* GET base
* Ajuste por trimestre
* Requerimiento final

### Card 4: Alertas gestacionales

* Datos incompletos
* Embarazo múltiple
* Pérdida de peso
* Semanas dudosas
* Revisión profesional requerida

Ocultar:

* Peso ideal
* Objetivo IMC
* Percentiles adultos
* Riesgo cintura/cadera automático
* Diagnóstico por pliegues como métrica principal

---

## Resultado esperado

La vista del paciente debe sentirse como un dashboard clínico simple, no como un formulario gigante. La información técnica debe existir, pero organizada en detalles expandibles. El profesional debe poder entender el estado del paciente en menos de 10 segundos.
