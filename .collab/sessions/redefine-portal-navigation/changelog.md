# Changelog: redefine-portal-navigation

## Summary
Se ha transformado el portal del paciente en una plataforma más accesible y profesional, simplificando la navegación a 4 pilares y permitiendo el acceso universal mediante email y código.

## Cambios Clave

### Backend
- **Nuevo Endpoint de Login**: `POST /patient-portals/login` permite obtener un JWT sin necesidad de un token en la URL.
- **Validación Robusta**: El sistema busca invitaciones activas y verifica el código dinámico asociado.

### Frontend
- **Nueva Página de Login**: `/portal/login` con diseño premium y manejo de errores.
- **Ruta Persistente**: `/portal/me` permite a los pacientes logueados acceder directamente a su dashboard.
- **Navegación Refactorizada**:
  - Sidebar simplificado: Diario, Preguntas, Planes e Información.
  - Eliminación de secciones obsoletas (Recursos, Biblioteca, Portada).
  - Redirección inteligente: Si intentas entrar a `/portal/me` sin sesión, vas al login.

## Decisiones Técnicas
- **Sesión Global**: Se usa la clave `portal_session_me` para diferenciar el login global de los accesos por link directo (`portal_session_[token]`).
- **Reusabilidad**: Se refactorizó `PortalClient` para ser agnóstico al método de acceso.

## Próximos Pasos
- Implementar notificaciones en tiempo real (Push/Web).
- Añadir recordatorio de "Código de Acceso" vía email si el paciente lo olvida.
