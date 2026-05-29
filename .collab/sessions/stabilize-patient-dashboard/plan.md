# Plan: Estabilización del Dashboard de Pacientes (`stabilize-patient-dashboard`)

## Objetivo
Finalizar la estabilización estructural de `PatientDetailClient.tsx`, corregir la visibilidad y persistencia del campo Edad, asegurar que los modales de invitación al portal no se cierren prematuramente y resolver errores de tipos en el backend.

## Alcance
- **Frontend**:
  - `PatientDetailClient.tsx`: Limpieza de JSX, validación de persistencia de `age`.
  - `CreatePatientClient.tsx`: Asegurar visibilidad del campo Edad.
  - `Modal.tsx`: Robustez ante clics accidentales.
- **Backend**:
  - `auth.service.ts`: Corregir casting de `SubscriptionPlan`.
  - `patient-portals.service.ts`: Revisar construcción de URL para evitar errores de conexión en localhost.

## Pasos
1. [x] Auditoría inicial de archivos (Investigación completa).
2. [x] Mejora de `Modal.tsx` con `stopPropagation`.
3. [x] Verificación de tipos en `auth.service.ts` (Cast corregido).
4. [ ] Revisar `CreatePatientClient.tsx` para asegurar que el campo Edad sea visible y funcional.
5. [~] Ajustar `PatientDetailClient.tsx` para asegurar que `age` se guarde y muestre correctamente, incluyendo reparaciones estructurales de JSX para recuperar el parser.
6. [ ] Validar generación de link del portal.

## Verificación
- Lint y Typecheck en frontend y backend.
- Verificación visual (por el usuario).
