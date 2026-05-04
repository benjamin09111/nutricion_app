# Especificacion Tecnica: Modulo 5 - CRM Nutricional (Pacientes)

## 1. Proposito

Guardar y operar el perfil clinico del paciente para que el resto del flujo tenga contexto.

## 2. Estado actual

Este modulo ya existe y es parte del core del producto.

## 3. Modelo de datos

### `Patient`

- nombre completo
- email y telefono
- documento
- fecha de nacimiento
- genero
- altura y peso
- restricciones dietarias
- resumen clinico
- variables custom
- metas fitness/nutricionales
- tags y estado

### `Consultation`

- paciente
- nutricionista
- fecha
- titulo
- descripcion
- metrics JSON

### `PatientExam`

- paciente
- fecha
- archivo
- notas
- resultados JSON

## 4. Contratos actuales

- `POST /patients`
- `GET /patients`
- `GET /patients/:id`
- `PATCH /patients/:id`
- `DELETE /patients/:id`
- `POST /patients/:id/exams`

## 5. Frontend

- `/dashboard/pacientes`
- `/dashboard/pacientes/new`
- `/dashboard/pacientes/[id]`
- `/dashboard/consultas`
- `/dashboard/consultas/nueva`

## 6. Reglas de negocio

- Los datos pertenecen al nutricionista autenticado.
- Un paciente no debe cruzarse entre cuentas.
- El detalle del paciente debe abrir su historia completa.
- El CRM alimenta proyectos, dietas, recetas y entregables.

## 7. Integracion con workflow

- `Project` puede apuntar a `patientId`.
- consultas y examenes enriquecen el contexto de planificacion.

