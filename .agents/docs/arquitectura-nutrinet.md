# Arquitectura NutriNet

Resumen técnico profundo sobre la organización y comunicación del sistema.

## Separación del Sistema
1. **Frontend (Next.js 16)**:
   - App Router.
   - Directorio `src/features/` organiza las pantallas por dominios lógicos (pacientes, recetas, auth, dashboard) conteniendo componentes locales, custom hooks de estado y tipos.
   - Directorio `src/components/ui/` contiene los elementos atómicos de diseño y componentes globales.
2. **Backend (NestJS 11)**:
   - Arquitectura de Monolito Modular.
   - Cada módulo encapsula controladores, servicios y DTOs independientes.
   - Conexión e interacción con base de datos gestionada por **Prisma ORM**.

## Flujos de Datos Sensibles
- **Datos Clínicos de Salud**: Almacenados en PostgreSQL de forma encriptada bajo AES-256 en reposo.
- **Asistente Clínico de IA**:
  - Las recetas y planes generados efímeramente no guardan datos clínicos directamente en el proveedor externo (acuerdo DPA activo).
  - La auditoría clínica registra las sugerencias versus la confirmación manual realizada por el profesional de salud.
