# Walkthrough - Refactorización de Metas Nutricionales (Solo Calorías y Proteínas)

Se ha completado la restricción de las metas nutricionales a exclusivamente **Calorías** y **Proteínas** en todos los módulos clave del sistema.

## 1. Cambios por Módulo

### Detalle del Paciente (`PatientDetailClient.tsx`)
- Se eliminaron las métricas de Carbohidratos y Grasas de la visualización y edición.
- Se reparó la estructura JSX que presentaba errores de anidamiento en las columnas.
- El grid se ajustó a 2 columnas para una estética limpia.

### Creación de Paciente (`CreatePatientClient.tsx`)
- Se eliminaron los campos de Carbohidratos y Grasas del formulario de creación.
- **Corrección de Codificación**: Se eliminaron los caracteres corruptos (mojibake) como `Ã©`, `Ã­`, `PÃ©rdida`, etc., restaurando las tildes y eñes correctas en español.

### Gestión de Recetas (`RecipesClient.tsx`)
- Se eliminaron las barras de progreso de Carbohidratos y Grasas del panel lateral.
- Se eliminaron los inputs de edición de metas para Carbohidratos y Grasas.
- Se actualizaron las secciones de "Cumplimiento diario" y "Cumplimiento semanal" para mostrar solo Calorías y Proteínas.
- Se actualizó el mensaje de advertencia de la IA para reflejar que solo considera Proteínas y Calorías.
- Se ajustó la lógica de validación de metas para no requerir valores positivos en Carbs/Fats.

### Carrito de Compras (`CartClient.tsx`)
- Se eliminaron las métricas de Carbohidratos y Grasas del resumen de objetivos en el panel lateral.
- Se actualizó la lógica de lectura de variables personalizadas para validar solo Calorías y Proteínas.

## 2. Verificación Técnica

- **Estabilidad**: El sistema compila correctamente. No hay errores de sintaxis JSX pendientes.
- **Persistencia**: La lógica de `customVariables` sigue funcionando; simplemente se omiten Carbs/Fats en la capa de presentación.
- **Internacionalización**: Se preservó y corrigió el texto en español.

## 3. Próximos Pasos Recomendados
- Realizar una prueba de exportación a PDF para asegurar que el "Entregable" también refleje este cambio (si aplica).
- Monitorear la respuesta de la IA en la generación de recetas para confirmar que prioriza correctamente los dos macros restantes.
