# Core Rules — Plan de Desarrollo y Cierre de Sesión

## "Crear un plan"

Cuando el usuario diga **"crear un plan"**, el agente debe aplicar las siguientes directrices en todas las tareas subsiguientes:

-   Reutilizar componentes existentes para no agregar código extra.
-   Construir en base a lo que ya existe en el proyecto.
-   Seguir buenas prácticas: modularidad, funciones útiles y pequeñas, sin código spaghetti ni super funciones.
-   Optimizar llamadas y performance.
-   Asegurar mantenibilidad y escalabilidad.
-   No tocar nada que no sea necesario.
-   Construir solo lo necesario para cumplir los objetivos y la tarea específica.
-   Si algo es ambiguo, **preguntar** antes de implementar.

## "Terminar sesión"

Cuando el usuario diga **"terminar sesión"**, el agente debe:

1.  Ejecutar `npm run build` para asegurar que no se rompe nada.
2.  Verificar que nada se ha roto.
3.  Preguntar al usuario si desea crear una PR. Si responde que sí, redactar una descripción breve en inglés de lo realizado durante la sesión.
