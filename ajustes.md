Ajustes importantes que haría
1. Sexo biológico no debería ser opcional si calculas GET

Pusiste:

Sexo biológico: Opcional. Se requiere para el cálculo del gasto energético.

Ahí hay contradicción.

Si usas Mifflin-St Jeor, el sexo biológico afecta directamente la fórmula. Entonces debería ser:

Sexo biológico: Requerido para cálculos energéticos.

O bien:

Sexo biológico: Opcional, pero si no se informa, el GET no se calcula automáticamente.

Mi recomendación UX:

Sexo biológico *
Requerido para calcular gasto energético.
2. Peso pregestacional no debería ser “opcional” si quieres evaluación gestacional completa

Pusiste:

Peso pre-gestacional: Opcional.

Pero después calculas:

IMC pregestacional;
estado nutricional inicial;
ganancia actual;
ganancia recomendada;
ganancia restante.

Todo eso depende del peso pregestacional.

Entonces yo lo dejaría así:

Peso pregestacional: requerido si está embarazada y se desea evaluación gestacional completa.

UX ideal:

Si la paciente está embarazada pero falta peso pregestacional:

Modo gestante incompleto.
Puedes calcular IMC actual y trimestre, pero no ganancia de peso ni rango recomendado.

Así evitas bloquear todo el flujo.

3. Tipo de embarazo múltiple necesita lógica propia

Está bien que preguntes:

Tipo de embarazo: Único o Múltiple

Pero cuidado: si selecciona Múltiple, no deberías aplicar automáticamente los mismos rangos de ganancia de embarazo único.

Para evitar error, haría esto:

Si tipo de embarazo = Múltiple:
- Mostrar alerta: “Los rangos de ganancia pueden diferir en embarazo múltiple. Requiere validación profesional.”
- No usar automáticamente el rango estándar de embarazo único, salvo que tengas una tabla específica.

Esto te protege clínicamente.

4. Semanas de gestación: 1 a 42 está bien, pero agregaría alertas

El rango 1–42 está bien como validación dura, pero yo agregaría alertas suaves:

< 4 semanas: “Verificar edad gestacional ingresada.”
> 40 semanas: “Embarazo de término o post-término, validar con profesional.”
> 42 semanas: bloquear o pedir corrección.

No es obligatorio, pero mejora calidad.

5. Macros por porcentaje están bien, pero deben tener mínimos clínicos

Pusiste:

Proteínas 20%, carbohidratos 55%, grasas 25%.

Eso está bien como distribución general, pero en gestantes conviene agregar límites mínimos/referenciales.

Por ejemplo, INTA Universidad de Chile menciona que en embarazo normal no se recomienda mayor ingesta calórica en primer trimestre, y que se incrementa en segundo y tercer trimestre; también menciona valores referenciales como proteína y carbohidratos mínimos adecuados para embarazo.

Entonces, para gestante, tu app podría calcular así:

Calorías finales = GET base + ajuste gestacional
Proteína = máximo entre fórmula porcentual y mínimo gestacional
Carbohidratos = máximo entre fórmula porcentual y mínimo gestacional
Grasas = completar dentro del rango recomendado

No necesariamente tienes que implementarlo ahora, pero sería más robusto que solo 20/55/25.

6. Cuidado con “Peso Saludable Ideal”

Para paciente estándar está bien, pero yo cambiaría el nombre.

En vez de:

Peso Saludable Ideal

usaría:

Rango de peso saludable estimado

¿Por qué? Porque “ideal” suena más normativo o estético. “Rango saludable estimado” es más clínico y menos problemático.

7. En menores de 18 años, necesitas sexo sí o sí

Dices:

En menores de 18 años calcula percentil y clasificación según curvas MINSAL.

Perfecto, pero para curvas infantiles/adolescentes necesitas:

edad exacta;
sexo;
peso;
talla.

Entonces si edad < 18 y no hay sexo biológico, deberías mostrar:

No se puede calcular clasificación por percentil sin sexo biológico.
Lo que falta agregar
A. Fecha de evaluación

Muy importante.

En creación de ficha deberías guardar:

Fecha de evaluación

Aunque sea automática con la fecha actual.

Esto es clave si después quieres historial y progreso.

B. Peso habitual

Agregaría en Antropometría o Anamnesis:

Peso habitual

Con eso puedes calcular:

% cambio de peso = ((peso actual - peso habitual) / peso habitual) × 100

Es muy útil clínicamente.

C. Peso objetivo definido por profesional

No lo calcularía siempre automáticamente. Lo dejaría como input opcional:

Peso objetivo profesional

Porque a veces el objetivo no es el “peso ideal” matemático.

D. Fórmula usada y factor de actividad

En la card de GET deberías mostrar un detalle expandible:

Fórmula: Mifflin-St Jeor
Factor de actividad: 1.2 sedentario
TMB: X kcal/día
GET: X kcal/día

Eso le da transparencia al nutricionista.

E. Ajuste calórico manual

Muy importante para una app profesional.

Después de calcular calorías, permite:

Ajuste manual de calorías

Ejemplo:

GET calculado: 1718 kcal/día
Ajuste profesional: +150 kcal
Calorías finales: 1868 kcal/día

Así la app no obliga al profesional a aceptar el cálculo automático.

F. Motivo de consulta

Lo agregaría sí o sí en Paso 1 o Paso 2.

Motivo de consulta

Ejemplos:

control gestacional;
baja de peso;
ganancia muscular;
diabetes gestacional;
alimentación vegetariana;
educación alimentaria;
rendimiento deportivo.

El foco nutricional es más estructurado, pero el motivo de consulta es lo que el paciente realmente dice.

G. Diagnóstico nutricional editable

No dejes que todo sea automático.

Agrega en resumen final:

Diagnóstico nutricional profesional

Editable por el nutricionista.

Ejemplo:

Paciente gestante de 12 semanas, con IMC pregestacional normal, ganancia de peso actual dentro de rango esperado. Se sugiere seguimiento de ganancia ponderal y síntomas digestivos.
H. Historial desde el inicio

Como hablamos antes, cada ficha/evaluación debería guardarse como snapshot.

En el Paso 6, al guardar:

Guardar como nueva evaluación
Actualizar evaluación actual

Y cada evaluación debería guardar:

datos ingresados;
cálculos generados;
fecha;
profesional;
notas;
alertas existentes en ese momento.