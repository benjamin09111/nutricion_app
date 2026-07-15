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

## "Ejecuta el plan" / Tareas

Cuando el usuario diga **"Ejecuta el plan"**, **"ejecuta paso a paso"** o frases similares indicando que se debe ejecutar una tarea, el agente debe aplicar automáticamente estas directrices:

-   **Buenas prácticas**: modularidad, funciones pequeñas y con un solo propósito, sin código spaghetti ni super funciones.
-   **UTF-8 y español**: preservar siempre tildes, eñes y caracteres especiales del español (á, é, í, ó, ú, ü, ñ, ¿, ¡). **NUNCA** introducir caracteres corruptos como "Ã¡", "Ã©", "Ã³", "â€"", "âˆž" o cualquier secuencia con "Ã". Todo el código debe guardarse en UTF-8 sin BOM. Verificar siempre después de editar que los caracteres españoles y especiales se renderizan correctamente.
-   **Alineación visual simétrica**: en layouts con columnas, grids o paneles, mantener alturas, anchos y márgenes equilibrados para una experiencia visual armónica y profesional.
-   **Reutilizar componentes**: preferir siempre componentes existentes del proyecto sobre crear nuevos, equilibrando mantenibilidad y simplicidad. No añadir complejidad innecesaria.
-   **Variables de entorno para URLs**: nunca hardcodear `localhost` ni dominios en código fuente. Usar siempre variables de entorno (`process.env.*`) para URLs y endpoints. Las URLs deben ser configurables por ambiente. Las variables disponibles son `FRONTEND_URL`, `PORTAL_BASE_URL`, `APP_URL`, `NEXT_PUBLIC_API_URL`, etc.
-   **Modales cierran con backdrop click**: todo `Modal` debe cerrarse al hacer clic fuera. El componente `Modal` ya tiene `closeOnBackdropClick={true}` por defecto. Solo desactivarlo explícitamente con `closeOnBackdropClick={false}` si hay una razón UX válida (ej. confirmación de eliminación).

## "Terminar sesión"

Cuando el usuario diga **"terminar sesión"**, el agente debe:

1.  Ejecutar `npm run build` para asegurar que no se rompe nada.
2.  Verificar que nada se ha roto.
3.  Preguntar al usuario si desea crear una PR. Si responde que sí, redactar una descripción breve en inglés de lo realizado durante la sesión.
