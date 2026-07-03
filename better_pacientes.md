


Módulo de Fichas Clínicas
Propuesta de Arquitectura
(KAN-51)


Elaborado por: Luciano Zambrano
Fecha: 30/06/2026



Resumen:
El presente documento tiene como objetivo definir la propuesta de arquitectura técnica y de interfaz para el desarrollo del Módulo de Fichas Clínicas (KAN-51). A partir de la revisión del sistema actual, el análisis de estándares clínicos nacionales y la consulta directa con profesionales en ejercicio, este informe detalla la reestructuración necesaria del modelo de datos en Prisma, la organización visual de los componentes (UI/UX) y la lógica requerida para la exportación de documentos. El propósito es establecer una base sólida de requerimientos que permita al equipo de desarrollo implementar una solución escalable, eficiente y estrictamente apegada a la realidad clínica de una consulta nutricional.

Reestructuración del Modelo de Datos (Prisma)
Para que la ficha sea útil en un entorno clínico real, se deben añadir las siguientes entidades y campos vinculados al paciente:
Datos del Paciente (Ex-Identidad): Renombrar la sección. Mover la fecha de nacimiento aquí y automatizar el cálculo de la edad.
Antecedentes Vitales y Estilo de Vida: Crear campos para ocupación, horarios laborales, consumo de fármacos/drogas y patologías.
Gineco-obstétricos (Condicional por sexo): Para pacientes de sexo femenino, añadir campos de embarazo, semanas de gestación y peso pre-gestacional.
Anamnesis Nutricional: Crear un modelo para registrar la frecuencia de consumo y recordatorios de 24 horas.
Antropometría Ampliada: Mantener peso y talla como obligatorios, pero añadir campos opcionales para el registro de pliegues cutáneos.

Relación entre Paciente y Ficha Clínica (Prisma)
La entidad Paciente ya existe en el sistema (datos base: nombre, RUT, contacto, etc.). La Ficha Clínica no debe duplicar esa información ni reemplazar al Paciente, sino extenderlo con datos de dominio clínico. Se propone la siguiente relación:
Cardinalidad 1:1 (Paciente ↔ FichaClinica): cada paciente tiene una única ficha clínica viva, identificada por una clave foránea única pacienteId en el modelo FichaClinica (relación @relation con @unique en Prisma). Esto evita fichas huérfanas o duplicadas para un mismo paciente.
Separación de responsabilidades: Paciente conserva únicamente datos administrativos/identificatorios; FichaClinica concentra los sub-modelos clínicos (AntecedentesVitales, DatosGinecoObstetricos, AnamnesisNutricional, Antropometria), cada uno vinculado por fichaClinicaId como relación 1:1 o 1:N según corresponda (ej. Antropometria es 1:N para permitir historial de mediciones en el tiempo).
Creación automática: al registrar un nuevo Paciente, se crea automáticamente su FichaClinica asociada (vacía), de modo que el nutricionista siempre encuentre la sección disponible sin pasos manuales adicionales.
Esquema simplificado propuesto (Prisma):
model FichaClinica { 
  id String @id @default(cuid()) 
  pacienteId String @unique 
  paciente Paciente @relation(fields: [pacienteId], references: [id]) 
  antecedentesVitales AntecedentesVitales?
  ginecoObstetricos GinecoObstetricos? 
  anamnesisNutricional AnamnesisNutricional? 
  antropometrias Antropometria[] 
}

Arquitectura de la Interfaz (UI/UX)
Dado el volumen de datos que maneja una ficha clínica completa, la vista no puede ser un formulario plano interminable.
Distribución Visual: Reestructurar la ficha utilizando componentes desplegables (Accordion) o pestañas (Tabs) separadas por sección médica. Esto evita la fatiga visual del profesional.
Sinergia con el nuevo módulo patient-intake: Como el equipo acaba de integrar los formularios públicos, la ficha clínica interna debe auto-completarse con los datos que el paciente ya llenó desde su casa. La interfaz debe mostrar qué datos fueron "Proporcionados por el paciente" y cuáles calculó el nutricionista.

Lógica de Exportación (PDF)
Permitir seleccionar qué módulos de la ficha clínica se incluyen en la exportación (ej: exportar solo la anamnesis y antropometría para derivar al paciente a un médico, omitiendo datos irrelevantes).
Incluir automáticamente las curvas de patrones de crecimiento del MINSAL en el PDF si el paciente es población infantil.


Fuentes y Metodología de Investigación
Para asegurar que la propuesta refleje cómo trabaja un nutricionista en la práctica real (y no solo una estructura de datos genérica), se consultaron las siguientes fuentes:
Consulta con profesional en ejercicio: reunión de revisión del sistema junto a un nutricionista titulado en ejercicio, quien validó los campos clínicos mínimos que debería tener una ficha (antecedentes vitales, gineco-obstétricos, anamnesis nutricional) y confirmó cómo se estructura una anamnesis en una consulta real.
Estándares clínicos nacionales: patrones de crecimiento y curvas antropométricas del MINSAL, utilizados como referencia obligatoria para población infantil en fichas nutricionales en Chile.
Revisión interna del sistema actual: análisis del módulo de Pacientes y del nuevo módulo patient-intake para identificar qué datos ya se recolectan hoy y evitar duplicar información al diseñar la Ficha Clínica.

Estos hallazgos son consistentes con los reportados en el Informe de revisión general y posibles mejoras de interfaz (KAN-50), que documenta con mayor detalle las inconsistencias clínicas encontradas en el sistema actual.


