1. Calendario (Google Calendar Style)
Backend: Tienes un CalendarsController con el endpoint GET /calendars/:id/view/week.
Capacidad: Este endpoint devuelve un "View" que combina: Citas confirmadas, Solicitudes pendientes y Bloqueos de horario. Está diseñado para que el frontend lo pinte directamente en un componente de calendario.
Slots: El SlotsService calcula en tiempo real qué huecos están libres basándose en tus reglas de trabajo y lo que ya está ocupado.
2. Conectar con Google Calendar
Backend: Existe una GoogleStrategy en el módulo de Auth y un servicio de NotificationsService (que aunque tiene Redis desactivado, ya tiene la lógica de calendar.sync).
Capacidad: El sistema está preparado para guardar los googleTokens en el usuario y sincronizar eventos.
3. Modificar horarios laborales
Backend: Endpoint PUT /calendars/:id/availability/rules.
Capacidad: Permite definir reglas complejas (ej: Lunes de 09:00 a 14:00 y de 16:00 a 20:00). El backend valida estas reglas cada vez que alguien intenta pedir una cita.
4. Próximas y Pasadas Citas
Backend: Endpoint GET /appointments.
Capacidad: Soporta filtros por status (CONFIRMED, CANCELLED) y fechas. Puedes hacer dos llamadas: una para las que vienen y otra para el historial.
5. Crear Cita (Manual)
Backend: Endpoint POST /appointments.
Capacidad: Permite al nutricionista agendar a un paciente directamente. El backend valida que el nutricionista no se "solape" a sí mismo.
6. Peticiones de Cita (Tab de solicitudes)
Backend: RequestsController con endpoints GET /requests, POST /requests/:id/accept y POST /requests/:id/reject.
Capacidad: Gestiona el flujo donde el paciente pide y tú confirmas. Al aceptar, se convierte automáticamente en una Appointment.
7. Compartir horario (Booking Links)
Backend: BookingLinksController.
Capacidad: Puedes generar un link único (token). El backend tiene endpoints públicos que permiten a cualquier persona ver tu disponibilidad y enviar una solicitud sin necesidad de estar logueado, pero siempre bajo tu tenantId.