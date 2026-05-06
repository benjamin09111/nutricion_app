# Changelog - Refactorización de Metas Nutricionales

## [2026-05-04] - Refactorización de Macros

### Añadido
- Ninguno (esta fue una tarea de simplificación).

### Cambiado
- **Interfaz de Usuario**: Restricción de las metas nutricionales a solo **Calorías** y **Proteínas** en:
  - Dashboard de Detalle de Paciente.
  - Formulario de Creación de Nuevo Paciente.
  - Planificador de Recetas (Sidebar y Editor).
  - Resumen del Carrito de Compras.
- **Validación**: Los esquemas de validación de metas ahora solo consideran obligatorias las Calorías y Proteínas.
- **Localización**: Corrección masiva de codificación UTF-8 en `CreatePatientClient.tsx` y otros archivos afectados por problemas de caracteres especiales.

### Eliminado
- **Métricas**: Se eliminaron Carbohidratos (Carbs/CHO) y Grasas (Fats/LIP) de todas las visualizaciones de metas y progreso.
- **Archivos Temporales**: Limpieza de scripts de reparación automatizados.

### Fijo
- **Sintaxis JSX**: Reparación de errores de anidamiento de `div` en `PatientDetailClient.tsx` que impedían la compilación.
