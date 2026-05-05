# Sesión Activa: Refactorizar Metas Nutricionales de Pacientes

**ID**: `refactor-patient-nutritional-goals`
**Modo**: `STRICT`
**Estado**: `Phase 2: Plan`
**Objetivo**: Limitar las metas nutricionales de los pacientes a solo "Calorías" y "Proteínas", eliminando "Carbohidratos" y "Grasas" de la interfaz y lógica principal del módulo de pacientes.

## 📁 Archivos Involucrados
- `frontend/src/app/dashboard/pacientes/[id]/PatientDetailClient.tsx` (Principal)
- `frontend/src/app/dashboard/pacientes/new/CreatePatientClient.tsx` (Consistencia)
- `frontend/src/app/dashboard/recetas/RecipesClient.tsx` (Consistencia visual)
- `frontend/src/app/dashboard/carrito/CartClient.tsx` (Consistencia visual/lógica)

## 🛠️ Pasos de Implementación

### 1. PatientDetailClient.tsx
- [ ] Eliminar los objetos correspondientes a "Carbs" y "Fats" del array de mapeo en la sección "Metas nutricionales" (aprox. línea 2175).
- [ ] Asegurarse de que el layout (grid grid-cols-2) se mantenga armonioso con solo 2 elementos.

### 2. CreatePatientClient.tsx
- [ ] Eliminar los objetos correspondientes a "Carbs" y "Fats" del array de mapeo (aprox. línea 357).
- [ ] Corregir errores de codificación (mojibake) detectados en el archivo (ej. `AntropometrÃ­a` -> `Antropometría`).

### 3. RecipesClient.tsx
- [ ] Eliminar las barras de progreso de Carbohidratos y Grasas en el sidebar de resumen (aprox. línea 4551).
- [ ] Eliminar los inputs de Carbohidratos y Grasas en el modal de edición de metas (aprox. línea 4637).
- [ ] Actualizar el mensaje de advertencia cuando no hay metas (línea 4731) para que solo mencione Proteína y Calorías.

### 4. CartClient.tsx
- [ ] Actualizar la validación de metas nutricionales para que solo requiera Calorías y Proteínas si es necesario, o al menos no falle por falta de las otras.

## 🧪 Plan de Verificación
- [ ] Abrir el detalle de un paciente y verificar que solo aparezcan Calorías y Proteínas en la sección de metas.
- [ ] Editar un paciente y confirmar que se pueden guardar las metas sin problemas.
- [ ] Crear un nuevo paciente y verificar la misma consistencia.
- [ ] Ir al módulo de Recetas y confirmar que el resumen lateral solo muestra progreso de Calorías y Proteínas.
