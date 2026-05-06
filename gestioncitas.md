# 🧠 PROJECT PLAN — Appointment Service (Reusable + SaaS Ready)

## 🎯 Objetivo

Construir un servicio de gestión de citas reutilizable, desacoplado del sistema principal de nutrición, pero integrable de forma transparente como si fuera parte de la app.

Debe permitir:
- Reutilización en múltiples proyectos
- Escalabilidad a SaaS
- Integración limpia con frontend existente (Next.js)
- Posibilidad de monetización futura

---

## 🧱 Contexto actual (IMPORTANTE)

Stack actual:
- Frontend: Next.js (Vercel)
- Backend principal: NestJS (Render)
- Usuario final: nutricionistas

Requisitos clave:
- Mantener experiencia unificada (no debe notarse como servicio externo)
- Reutilizable en otros proyectos (kinesiología, psicología, etc.)
- Código mantenible, modular y escalable

---

## 🏗️ Arquitectura propuesta

### High-Level

[ Next.js App ]
        |
        v
[ Nutrition API (NestJS) ] (opcional proxy)
        |
        v
[ Appointment Service (NestJS independiente) ]
        |
        v
[ PostgreSQL DB ]
        |
        v
[ Integraciones externas ]
  - Google Calendar
  - Email (Resend / SMTP)
  - WhatsApp (futuro)

---

## ⚙️ Enfoque técnico

### ❌ NO hacer
- Meter lógica de citas dentro del backend actual
- Acoplar citas al dominio de nutrición

### ✅ HACER
- Crear servicio independiente (appointments-api)
- API REST desacoplada
- Multi-tenant desde el inicio
- Prepararlo como producto (no solo feature)

---

## 🧩 Módulos del sistema

### 1. Entidades principales

- Tenant (multi-cliente)
- Professional
- Patient
- Service (tipo de cita)
- Availability
- Appointment
- BlockedSlots

---

### 2. Appointment Engine

Responsabilidades:
- Crear citas
- Validar disponibilidad
- Evitar solapamientos (overlaps)
- Reagendar
- Cancelar
- Manejar estados:
  - pending
  - confirmed
  - cancelled
  - completed

---

### 3. Availability Engine

Debe soportar:
- Horarios semanales
- Excepciones (feriados, vacaciones)
- Bloqueos manuales
- Buffer entre citas
- Duraciones variables por servicio

IMPORTANTE:
No usar agendas rígidas → calcular disponibilidad dinámicamente

---

### 4. Integraciones

#### Google Calendar
- Crear eventos automáticamente
- Sincronización básica

#### Notificaciones
- Email automático
- Recordatorios (clave para reducir no-shows)

#### Futuro
- WhatsApp API
- Webhooks

---

### 5. Multi-Tenant

Cada request debe incluir:

tenant_id

Ejemplos:
- "nutri_app"
- "kine_app"
- "cliente_x"

Implementación:
- Una sola base de datos
- Filtrado por tenant_id en todas las queries

---

## 🔌 Diseño de API (REST)

### Appointments

POST   /appointments  
GET    /appointments  
GET    /appointments/:id  
PATCH  /appointments/:id  
DELETE /appointments/:id  

---

### Availability

GET  /availability  
POST /availability  

---

### Scheduling

GET /availability/free-slots  

(Este endpoint es clave para el frontend)

---

## 🧪 Lógica crítica

### Validación de citas

- No permitir solapamientos
- Validar duración del servicio
- Respetar buffers entre citas

---

### Manejo de concurrencia

- Usar transacciones en base de datos
- Bloquear slots al reservar
- Evitar race conditions

---

## 📦 SDK (OBLIGATORIO)

Crear:

packages/appointments-sdk

Ejemplo de uso:

```ts
appointmentClient.createAppointment(data)
appointmentClient.getAvailability(professionalId)
appointmentClient.cancelAppointment(id)