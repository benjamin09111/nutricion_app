# Nuevo modulo en "PRINCIPAL" dentro de Nutrición y Dietética

Construir un nuevo tipo de entregable, copiaremos la misma interfaz y forma de uso que "Entregable rápido" en /dashboard/rapido. Queremos crear pautas alimenticias de una restricción específica. Te explico el funcionamiento:

- Las pautas de alimentación se caracterizarán para una restricción clínica o alimenticia, por ejemplo, "Pauta de Alimentación Hipertensión", "Pauta de Alimentación Diabetes", etc. Siempre debe elegir la restricción, e importar al paciente. Mantendremos la opción de que puede crear rápidamente la información del paciente ahí si no lo quiere importar.
- Debe contener la información del paciente: peso, IMC, cálculos automáticos, talla (altura), edad. Si no lo importa, puede ingresar estos datos manualmente, si los deja vacíos, no se incluyen en el PDF, mantengamos siempre esa lógica para lo opcional.
- Incluiremos una sección opcional: Próximo control. (si se deja vacío, no se incluye en el PDF)
- Sección opcional: presión arterial. (si se deja vacío, no se incluye en el PDF)
- Sección que siempre vendrá incluida: recurso educativo relacionado a la restricción elegida. Como tenemos recursos que se relacionan con hashtags, lo ideal sería recomendar el recurso automáticamente, relacionado a la restricción (si es que existe). Si no, daremos la opción de "Escribir información educativa".
- El contenido se dividirá en párrafos de dos columnas, yo puedo incluir otro párrafo si quiero, partiendo mínimo con uno.
- El párrafo tiene un título centrado que corresponde a la categoría alimenticia y entre paréntesis la cantidad de porciones al día, por ejemplo: "Lácteos descremados o semidescremados (3 porciones al día)", aparecerá ese ejemplo como placeholder en el título. Agrega los label para que sepa qué es cada input, para este titulo sería "Categoría y porciones al día".
- El párrafo tiene a la izquierda columna, una lista no enumerada de alimentos del tipo: porción - alimento, ejemplo "1 taza 200ml de leche", etc. Intentaremos re utilizar las porciones que tenemos en la plataforma con un select searcher, o sino puede escribirlo directamente.
- La otra columna tendrá una imagen, por ahora dejemos simplemente un ícono de gorro de chef gigante, ya que luego tendremos un JSON (crealo altiro) que tenga la categoría alimenticia y una url de la imagen en el public frontend. Esto ya que los párrafos se dividen por categorías y podemos elegir una imagen para que aparezca en esa categoría, hazlo pensando que en el futuro intentaremos relacionar siempre la restricción con algo, con imagenes, con otras cosas, etc, ya que tenemos en /detalles las restricciones de forma global, entonces siempre se re utilizan.
- Podemos agregar la cantidad de párrafos que queramos con una separación racional entre cada uno (cada párrafo tiene un título centrado y se compone de columna izq la lista no enum y columna derecha la imagen).
- Se puede exportar en PDF.
- Podremos guardar esta creación para re utilizarla luego, importante dejandole el hashtag o restricción alimenticia ahí rápidamente. Se guardará como "Pautas".
