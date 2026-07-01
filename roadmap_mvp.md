# Roadmap MVP - Citas Nutricion

## Objetivo
Construir un sistema de citas competitivo contra Encuadrado, pero con ventaja en nutricion: agenda, portal paciente, pagos, notificaciones, Google Calendar/Meet y comunidad profesional.

## Principios
- Primero flujo estable, despues automatizacion.
- Cada fase debe quedar usable.
- Backend valida reglas criticas.
- Frontend mobile-first.
- Modulos separados para facilitar extraccion futura.

## Fase 1 - Nucleo De Agenda
### Objetivo
Dejar citas confiables para el nutricionista.

### Funcionalidades
- Horarios laborales.
- Crear cita manual.
- Fijar/marcar citas.
- Tabs: `Mi horario`, `Proximas citas`, `Citas`.
- Estados de cita.
- Validaciones backend.

### Checklist Agente
- Revisar modelos Prisma.
- Asegurar DTOs.
- Implementar endpoints.
- Conectar frontend.
- Verificar lint/build.

## Fase 2 - Compartir Horario
### Objetivo
Permitir compartir disponibilidad publica.

### Funcionalidades
- Link publico.
- Pagina publica de disponibilidad.
- Slots disponibles.
- Copiar link.
- Metadata del link.

## Fase 3 - Portal Paciente Pide Cita
### Objetivo
Cerrar flujo paciente -> solicitud -> nutricionista.

### Funcionalidades
- Formulario paciente.
- Crear cita `REQUESTED`.
- Tab pendientes.
- Aceptar / rechazar / fijar.

## Fase 4 - Notificaciones
### Objetivo
Automatizar comunicacion con paciente.

### Funcionalidades
- Email cita creada.
- Email cita aceptada.
- Email rechazo / cancelacion.
- Logs de notificacion.
- Fallback si falla email.

## Fase 5 - Mobile First
### Objetivo
Hacer usable todo el flujo desde celular.

### Funcionalidades
- Agenda mobile.
- Proximas citas mobile.
- Crear cita mobile.
- Portal paciente responsive.

## Fase 6 - Google Calendar + Meet
### Objetivo
Integrar agenda profesional externa.

### Funcionalidades
- Conectar Google Calendar.
- Crear evento.
- Crear Google Meet.
- Guardar `googleEventId`.
- Guardar `meetingUrl`.

## Fase 7 - Cobro, Pago Y Boletas
### Objetivo
Preparar monetizacion.

### Funcionalidades
- Pago asociado a cita.
- Estados de pago.
- Marcar pago manual.
- Base para pasarela.
- Base para boletas.

## Fase 8 - Red Social De Nutricionistas
### Objetivo
Diferenciar producto mas alla de agenda.

### Funcionalidades
- Perfiles profesionales.
- Publicaciones.
- Recomendaciones.
- Derivaciones.
- Comunidad separada del modulo citas.

## Priorizacion 7 Dias
- Dia 1: Nucleo agenda.
- Dia 2: Compartir horario.
- Dia 3: Portal paciente pide cita.
- Dia 4: Notificaciones.
- Dia 5: Mobile.
- Dia 6: Google Calendar + Meet.
- Dia 7: Pagos, boletas y base social.

## Diferenciadores Contra Encuadrado
- Portal paciente conectado a ficha nutricional.
- Agenda + seguimiento nutricional.
- Notificaciones clinicas.
- Historial de atencion.
- Pagos ligados a cita.
- Comunidad profesional.
