1. El rango “11.5–16 kg total” no es el estándar chileno clásico

Ese rango 11.5–16 kg corresponde mucho a la recomendación tipo IOM/Institute of Medicine para embarazadas con IMC normal. No está mal como referencia internacional, pero si quieres decir “según Chile/MINSAL”, yo usaría el rango chileno.

En documentos chilenos de salud gestante aparece para estado nutricional normal una ganancia total aproximada de 10 a 13 kg, con ganancia semanal desde el segundo trimestre de aprox. 330 a 420 g/semana.

Entonces, para que tu app sea más chilena/MINSAL, yo cambiaría esto:

11.5–16 kg total

por esto:

10–13 kg total
330–420 g/semana desde el 2.º trimestre

O mejor aún, puedes dejar configurable:

Referencia usada: MINSAL Chile

y en otra opción:

Referencia usada: IOM internacional

Pero por defecto, para Chile, pondría MINSAL.

2. Lo que tienes ahora está bien

Con tu ejemplo:

Peso actual: 65 kg
Altura: 170 cm
Semana gestacional: 12
Peso pregestacional: 62.5 kg
IMC actual: 22.5
IMC pregestacional: 21.6
Ganancia actual: +2.5 kg

La lectura está bien:

IMC actual: 22.5 kg/m²
Clasificación gestacional: Normal
IMC pregestacional: 21.6 kg/m²
Clasificación inicial: Normal
Ganancia actual: +2.5 kg

También está bien que el GET diga:

GET estimado sin incremento por embarazo: 1718 kcal/día.
1.er trimestre: +0 kcal.
Requerimiento final estimado: 1718 kcal/día.

Eso coincide con el criterio de que en un embarazo normal no se recomienda aumento calórico en el primer trimestre; el aumento se aplica más bien en segundo y tercer trimestre. INTA Universidad de Chile menciona +350 kcal/día en segundo trimestre y +450 kcal/día en tercer trimestre, individualizando según edad, estado nutricional y actividad.

Qué le falta a tu app para estar completa

Te lo separo por módulos.

A. Datos básicos del paciente

Ya tienes varios, pero el set ideal sería:

Campo	Necesario
Nombre completo	Sí
RUT	Sí
Fecha de nacimiento	Sí
Edad automática	Sí
Sexo biológico	Sí
Email	Opcional
Teléfono	Opcional
Ocupación	Recomendado
Motivo de consulta	Muy recomendado
Fecha de atención	Muy recomendado
Profesional tratante	Recomendado

Yo agregaría motivo de consulta, porque cambia mucho el enfoque: control gestacional, baja de peso, aumento de masa muscular, diabetes gestacional, resistencia a la insulina, hipertensión, etc.

B. Datos gestacionales

Esto es clave. Yo agregaría:

Campo	Uso
Está embarazada	Activa modo gestante
Semanas de gestación	Clasificación gestacional
Peso pregestacional	IMC inicial y ganancia
Embarazo único o múltiple	Cambia ganancia recomendada
Fecha probable de parto	Útil clínicamente
Número de gestación/paridad	Contexto obstétrico
Lactancia	Otro modo especial, distinto a gestante

Importante: embarazo múltiple cambia la ganancia recomendada. Si tu app no pregunta eso, al menos deberías asumir “embarazo único” y mostrarlo:

Referencia calculada para embarazo único.
C. Evaluación antropométrica general

Lo mínimo:

Cálculo	Estado
IMC actual	Ya lo tienes
Clasificación IMC adulto	Solo no gestante
Peso saludable	Solo no gestante
Peso ideal / objetivo IMC	Solo no gestante
Peso ajustado	Útil en obesidad
% cambio de peso	Muy útil
Peso habitual	Recomendado
Peso objetivo definido por profesional	Recomendado

En modo gestante, el foco debe ser:

IMC pregestacional
Clasificación inicial
IMC actual según semana gestacional
Ganancia actual
Ganancia esperada
Ganancia restante estimada

Este último cálculo sería muy bueno:

Ganancia restante estimada = rango objetivo total - ganancia actual

Ejemplo con MINSAL:

Ganancia actual: +2.5 kg
Rango total recomendado: 10–13 kg
Ganancia restante estimada: 7.5–10.5 kg
D. GET y energía

Actualmente tienes:

GET sin embarazo
Incremento por trimestre
Requerimiento final

Muy bien.

Pero deberías agregar estos datos de entrada:

Campo	Por qué importa
Nivel de actividad física	Afecta GET
Fórmula usada	Transparencia
Factor de actividad	Transparencia
Objetivo nutricional	Mantener, subir, bajar, gestación
Ajuste calórico manual	Permite al nutricionista corregir

Ejemplo profesional:

Fórmula usada: Mifflin-St Jeor
GET base: 1718 kcal/día
Factor de actividad: sedentaria
Ajuste gestacional: +0 kcal
Requerimiento final: 1718 kcal/día
E. Macronutrientes

Los macros están bien, pero agregaría:

Campo	Recomendación
Proteína g/día	Ya tienes
Proteína g/kg	Muy útil
Carbohidratos g/día	Ya tienes
Grasas g/día	Ya tienes
Distribución porcentual	Recomendado
Fibra	Muy recomendado
Agua	Muy recomendado

En embarazo, además sería bueno mostrar mínimos/referencias:

Proteína: 86 g/día
Equivale a 1.32 g/kg peso actual

Para embarazo, se suelen considerar requerimientos mínimos mayores que en no gestantes; fuentes clínicas chilenas como INTA mencionan proteína aprox. 71 g/día, carbohidratos 175 g/día y grasas entre 20–35% de la energía.

F. Micronutrientes importantes en gestantes

Esto no necesariamente debe ser cálculo automático complejo, pero sí puedes poner una sección de “alertas/revisión profesional”.

Para gestantes, agregaría checklist de:

Nutriente	Importancia
Ácido fólico	Clave en embarazo
Hierro	Anemia/embarazo
Calcio	Salud ósea y fetal
Vitamina D	Frecuentemente evaluada
Yodo	Función tiroidea
Omega-3/DHA	Desarrollo fetal
B12	Especialmente vegetarianas/veganas
Sodio	Si hay hipertensión

No lo pondría como “prescripción automática”, sino como:

Revisar suplementación indicada por profesional tratante.
G. Pliegues cutáneos

Aquí tengo una observación importante.

Tus pliegues:

Tricipital
Bicipital
Subescapular
Suprailiaco

Sirven para estimaciones de composición corporal en ciertos contextos, pero en gestantes no los usaría como cálculo principal, porque el embarazo altera peso, líquidos, distribución corporal y la interpretación puede ser menos directa.

Yo haría esto:

Pliegues cutáneos: disponibles solo como registro antropométrico complementario.
No utilizados para diagnóstico gestacional automático.

Para paciente no gestante, sí podrías calcular:

Suma de 4 pliegues
Densidad corporal
% grasa estimado
Masa grasa
Masa libre de grasa

Pero con disclaimer fuerte, porque las fórmulas dependen de edad, sexo y población.

H. Chumlea / perímetros

La sección está bien, pero deberías separar mejor.

Chumlea sirve sobre todo cuando no puedes medir talla directamente, por ejemplo adultos mayores, pacientes hospitalizados o con movilidad reducida.

Campos útiles:

Campo	Uso
Altura de rodilla	Estimar talla
Circunferencia pantorrilla	Riesgo nutricional/muscular
Circunferencia braquial	Estado nutricional
Circunferencia cintura	Riesgo cardiometabólico
Circunferencia cadera	ICC
Relación cintura/cadera	Riesgo cardiometabólico
Relación cintura/altura	Muy útil

En gestantes, cintura/cadera no debería usarse como riesgo cardiometabólico estándar, porque el abdomen cambia por embarazo.

Entonces haría:

Perímetros cardiometabólicos no interpretados automáticamente durante embarazo.
Lista completa de cálculos que yo tendría
Para todos los pacientes
Edad automática
IMC
Clasificación IMC adulto
Peso saludable según IMC
Peso objetivo manual
Peso habitual
% cambio de peso
GET/TDEE
TMB/BMR
Factor de actividad
Calorías finales
Proteína g/día
Proteína g/kg
Carbohidratos g/día
Grasas g/día
Distribución porcentual de macros
Agua estimada
Fibra estimada
Circunferencia cintura
Relación cintura/cadera
Relación cintura/altura
Pliegues opcionales
% grasa opcional
Masa grasa opcional
Masa libre de grasa opcional
Para gestantes
Semana gestacional
Trimestre
Peso pregestacional
IMC pregestacional
Clasificación nutricional inicial
IMC actual
Clasificación gestacional según semana
Ganancia de peso actual
Rango de ganancia total recomendado
Ganancia semanal recomendada desde segundo trimestre
Ganancia restante estimada
GET sin embarazo
Incremento calórico por trimestre
Requerimiento energético final
Alerta si ganancia está baja/alta para la semana
Embarazo único/múltiple
Disclaimer clínico
Para adultos mayores o pacientes con talla no medible
Altura estimada por Chumlea
IMC con talla estimada
Circunferencia pantorrilla
Circunferencia braquial
Riesgo nutricional sugerido
Pérdida de peso involuntaria
Apetito/intake reciente
Veredicto final

Tu versión actual está muy bien encaminada. Lo único que corregiría sí o sí es esto:

Rango de ganancia recomendado: 11.5–16 kg total

Si quieres que sea estándar chileno, mejor:

Rango de ganancia recomendado: 10–13 kg total
Ganancia semanal recomendada: 330–420 g/semana desde el 2.º trimestre
Referencia: MINSAL Chile

Y además agregaría:

Ganancia restante estimada: 7.5–10.5 kg

Con esos ajustes, tu panel gestacional queda mucho más sólido, claro y profesional.