# Modo Seguro de Trabajo

Esta app ya tiene usuarios testers potenciales, así que desde ahora la regla es:

- `localdev` para desarrollar y romper cosas sin miedo
- `testing` para la base real que usan los nutris
- nunca tocar la base remota por accidente

## 1. Archivos de entorno

En `backend/` vas a usar estos archivos:

- `.env.localdev`
- `.env.testing`
- `.env`

`/.env` es siempre el archivo activo. No lo edites a mano si puedes evitarlo.

Parte desde estos ejemplos:

- [backend/.env.localdev.example](/C:/Users/Benjamin/Desktop/nutricion_app/backend/.env.localdev.example)
- [backend/.env.testing.example](/C:/Users/Benjamin/Desktop/nutricion_app/backend/.env.testing.example)

## 2. Flujo diario recomendado

Antes de programar:

```bash
cd backend
npm run db:use:local
npm run db:target
```

Antes de compartir la app a testers:

```bash
cd backend
npm run db:use:testing
npm run db:target
```

Si `db:target` muestra un host remoto, asume que estás apuntando a la base real de testers.

## 3. Migraciones seguras

Para aplicar migraciones:

```bash
cd backend
npm run db:migrate:safe -- --allow-remote
```

Qué hace este script:

- bloquea migraciones remotas si no pones `--allow-remote`
- revisa la migración más reciente
- si encuentra `DROP TABLE`, `DROP COLUMN`, `TRUNCATE TABLE` o `DELETE FROM`, la bloquea

Si de verdad necesitas una migración destructiva:

```bash
npm run db:migrate:safe -- --allow-remote --allow-destructive
```

Eso debería ser excepcional.

## 4. Seeds seguros del catálogo

Para volver a cargar categorías e ingredientes desde los `.txt` de la raíz:

```bash
cd backend
npm run db:seed:catalog:safe -- --allow-remote
```

Este seed:

- no borra tablas
- no hace truncate
- inserta sólo lo faltante
- usa `categories.txt` e `ingredients.txt`

## 5. Reglas operativas

- no desarrolles con `.env` apuntando a testing
- no uses `prisma db push` sobre la base remota
- no ejecutes scripts viejos de seed sin revisar
- antes de una migración remota, confirma con `npm run db:target`
- si una IA propone borrar o resetear datos, no lo ejecutes sin revisar el SQL

## 6. Qué hacer mañana antes de invitar testers

1. Crear `backend/.env.localdev` con tu base local.
2. Crear `backend/.env.testing` con la base remota real.
3. Activar testing:

```bash
cd backend
npm run db:use:testing
npm run db:target
```

4. Validar que el catálogo exista:

```bash
npm run db:seed:catalog:safe -- --allow-remote
```

5. Levantar la app y probar login, pacientes, dieta, carrito y entregable.

## 7. Política del proyecto

Desde ahora:

- toda base remota se considera importante
- toda migración remota requiere revisión
- todos los seeds deben ser idempotentes
- el desarrollo diario debe pasar por localdev
