# Registro de Errores Correctores

Este archivo acumula las fallas y correcciones realizadas al agente para evitar regresiones y repetir malas prácticas. Formato estrictamente negativo.

- **Nunca crees componentes o lógicas redundantes**: NUNCA crear un componente o lógica nueva si ya existe una solución reutilizable en el codebase. Buscar exhaustivamente antes de codificar.
- **Nunca dejes persistir estados fantasma**: No dejes que el estado gestacional o variables específicas de sexo persistan si el sexo del paciente cambia a Masculino u Otro. Limpiar las variables del formulario inmediatamente.
- **Nunca uses colores fuera de la paleta definida**: Usar SOLO los códigos hexadecimales de la paleta definida en `globals.css`. Nunca usar colores genéricos de Tailwind (`green-500`, etc.). Los colores de marca son: Emerald `#8da84f` / `#74853f` / `#f7fbe8`, e Indigo `#8f70d8`.
- **Nunca ejecutes comandos en la terminal sin aprobación previa**: La terminal y comandos como instalaciones de npm/pip o migraciones manuales requieren siempre la aprobación explícita del usuario a través del flujo normal del IDE.
