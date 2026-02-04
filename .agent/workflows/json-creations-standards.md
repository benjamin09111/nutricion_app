---
description: Estándar para el almacenamiento y ciclo de vida de las Creaciones (Dietas, Listas, Recetas) usando JSON como fuente de verdad.
---

# Estrategia de Persistencia de Creaciones ("JSON Source of Truth")

## 1. Principio Fundamental
Todas las creaciones generadas por la aplicación (Dietas, Pautas, Listas, Recetas) deben almacenarse primariamente como **JSON Estructurado** en la base de datos.
- **El JSON es la fuente de la verdad**.
- **El PDF es un artefacto desechable/regenerable** (output).

## 2. Ciclo de Vida: Edición vs. Descarga

### A. Guardado (Saving)
Cuando un usuario guarda un progreso o finaliza una creación:
1. Se captura el **State** completo del frontend (configuración, arrays de alimentos, textos).
2. Se serializa a un objeto JSON.
3. Se guarda en la DB en el campo `content` (tipo `JSONB`) del modelo `Creation`.
4. **NO** se genera ni guarda un PDF en este punto si es un borrador.

### B. Edición (Re-hidratación)
Cuando un usuario hace clic en "Editar":
1. El frontend descarga el JSON `content` de la DB.
2. Se inyecta este JSON en el estado de React (Stores/Context).
3. La interfaz se "reconstruye" exactamente como estaba.

### C. Descarga (Exportación)
Cuando un usuario quiere el PDF:
1. **Opción A (On-the-fly):** El backend recibe el JSON (o lo lee de la DB) -> Genera PDF en memoria -> Stream al cliente.
   - *Ventaja*: No ocupa espacio de almacenamiento. Siempre actualizado.
2. **Opción B (Cache - Opcional):** Si el PDF es muy pesado, se puede guardar en Storage (S3/Supabase) y poner la URL en la DB.
   - *Regla*: Si se edita el JSON, el PDF cacheado se invalida/borra inmediatamente.

## 3. Reglas de Validación de UI

- **Botón Editar**: SOLO disponible si existe el JSON fuente (`format: 'JSON'` o compatible).
- **Botón Descargar**: Disponible siempre. Si es formato nativo, dispara la regeneración del PDF desde el JSON.
- **Iconos de Formato**:
  - `JSON/Native`: Indica que es editable en la plataforma.
  - `PDF`: Indica un archivo externo subido (Legacy o importado) -> **NO Editable**.

## 4. Estructura de Datos (Schema)

```prisma
model Creation {
  id        String   @id @default(uuid())
  type      String   // DIET, RECIPE, SHOPPING_LIST
  format    String   // 'NATIVE' (JSON backed) | 'PDF' (External/Legacy)
  content   Json     // The Source of Truth
  metadata  Json?    // Summary fields for fast searching (calories, tags)
}
```
