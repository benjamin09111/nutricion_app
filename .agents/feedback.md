# AI Feedback & Anti-Patterns

Errores comunes a evitar basados en patrones conocidos de desarrollo NestJS/Next.js/Prisma.

## Criticos (siempre evitar)

### UTF-8 y Caracteres Especiales
- **NO** usar redireccion de salida (`>`, `>>`, `Out-File`) que corrompa tildes o ñ
- **NO** usar `echo` en PowerShell para contenido con caracteres especiales
- Verificar siempre que `á, é, í, ó, ú, ñ, ü` se preserven. Si aparecen `Ã¡, Ã©` = corrupcion

### PowerShell (Windows)
- **NO** usar `&&` para encadenar comandos. Usar `; if ($?) { }`
- **NO** usar `cd` o `Set-Location` dentro de comandos. Usar el parametro `workdir` del tool
- Rutas con espacios: siempre entre comillas dobles

### Base de Datos (Prisma)
- **NO** ejecutar migraciones sin permiso explicito (`npx prisma migrate dev`)
- **NO** hacer migraciones destructivas (drop column, drop table) sin respaldo
- **NO** modificar `schema.prisma` sin considerar datos existentes
- Usar `npx prisma generate` despues de cambios al schema

### Frontend (Next.js / React)
- **NO** mezclar Server Components con hooks/estado (los Server Components no pueden usar useState, useEffect, etc.)
- **NO** importar componentes cliente en server components sin `"use client"`
- **NO** usar modales nativos (alert, confirm, prompt) — usar `ConfirmationModal`
- **NO** crear componentes nuevos si ya existe uno similar en `components/ui/`
- **NO** olvidar `cursor-pointer` en elementos clickeables
- **NO** hardcodear URLs de API — usar `frontend/src/lib/api.ts`

### Backend (NestJS)
- **NO** crear modulos sin DTOs con class-validator
- **NO** exponer datos sensibles en logs o respuestas de error
- **NO** olvidar el guard de autenticacion en endpoints protegidos
- **NO** hacer queries N+1 — usar `include` o `select` de Prisma apropiadamente

### General
- **NO** hacer refactors no solicitados
- **NO** modificar archivos de configuracion sin preguntar
- **NO** instalar dependencias sin preguntar
- **NO** renombrar variables, funciones o terminologia clinica sin preguntar
- **NO** dejar imports sin usar, variables sin usar, codigo muerto
- **NO** escribir comentarios obvios — el codigo debe ser auto-documentado

---

## Repeat Mistakes (especificos del proyecto)
*(El agente registra aqui errores concretos cometidos en NutriNet)*
