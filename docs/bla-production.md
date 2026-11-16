# BLA: protección de artefactos de producción

## Qué protege

BLA reduce la exposición de los artefactos publicados frente a herramientas
automatizadas de ingeniería inversa. Puede auditar y proteger bundles JavaScript,
WASM y otros artefactos compilados.

No protege la idea de NutriNet, las credenciales, la base de datos, los datos
clínicos ni el código fuente del repositorio. Esas protecciones requieren control
de acceso, secretos fuera del repositorio, CSP, permisos mínimos, copias de
seguridad y revisión de arquitectura.

## Integración disponible

La rama incluye un registro MCP en `.mcp.json` y comandos raíz con la versión
fijada en `3.4.1`:

```bash
npm run security:bla:doctor
npm run security:bla:inspect -- frontend/.next
npm run security:bla:lint -- frontend/.next --json
npm run security:bla:harden -- frontend/.next
```

Los comandos usan `npx --yes` para no añadir BLA al runtime de NutriNet. La
versión queda fijada para evitar que un cambio futuro del paquete altere el
artefacto de producción sin revisión.

## Flujo recomendado antes de producción

1. Construir el frontend en un entorno limpio.
2. Ejecutar `security:bla:inspect` y `security:bla:lint` sobre el artefacto de
   salida. Revisar mapas de origen, símbolos y hallazgos.
3. Ejecutar `security:bla:harden` únicamente sobre una copia de la salida, nunca
   sobre el código fuente ni sobre el directorio de trabajo del desarrollador.
4. Validar el artefacto endurecido con las pruebas, navegación de la demo y
   comprobaciones de API.
5. Publicar solo si la verificación funcional y de seguridad pasan.

El hardening no se conecta automáticamente a `npm run build`: Next.js puede
depender de la estructura exacta de `.next` y una transformación automática sin
validación podría romper el runtime. La promoción debe ser una decisión explícita
del pipeline de release.

## Advertencia de seguridad

No se deben copiar al proyecto los `AGENTS.md`, skills o configuraciones de agente
del repositorio BLA. Este proyecto conserva sus propias reglas y solo incorpora la
herramienta MCP y el flujo explícito de release.
