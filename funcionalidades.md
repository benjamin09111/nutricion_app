# NutriNet - Funcionalidades por Plan

Lista completa de funcionalidades separadas por estado de desarrollo y categorías. Esto sirve como referencia para definir planes y membrecías.

---

## FUNCIONALIDADES ACTIVAS / CASI TERMINADAS

### 1. Motor Clínico (Flujo Secuencial)

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Dieta** | Planificación estratégica de alimentos y restricciones para el paciente | `/dashboard/dieta` |
| **Recetas y Porciones** | Cuantificación de porciones, distribución de comidas y llenado automático con IA | `/dashboard/recetas` |
| **Carrito** | Generación automática de lista de compras basada en la dieta y recetas | `/dashboard/carrito` |
| **Entregable** | Motor de generación y exportación de documentos profesionales en PDF | `/dashboard/entregable` |

### 2. Módulo Clínico Core

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Pacientes** | CRM completo: fichas clínicas, historial médico, restricciones dietéticas, progreso | `/dashboard/pacientes` |
| **Consultas** | Registro y seguimiento de sesiones clínicas individuales por paciente | `/dashboard/consultas` |
| **Fitness & Antropometría** | Tracking de mediciones corporales, porcentaje de grasa, progreso físico | `/dashboard/fitness` |
| **Citas** | Sistema profesional de agenda: horarios laborales, estados de cita, calendario | `/dashboard/citas` |

### 3. Gestión de Conocimiento y Contenido

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Alimentos** | Catálogo global y personal de ingredientes con valores nutricionales (Chile) | `/dashboard/alimentos` |
| **Platos** | Biblioteca de creaciones culinarias reutilizables | `/dashboard/platos` |
| **Recursos** | Biblioteca educativa: PDFs, plantillas, notas para pacientes | `/dashboard/recursos` |
| **Creaciones** | Gestión de todos los artefactos clínicos guardados por el nutricionista | `/dashboard/creaciones` |
| **Sustitutos** | Base de datos de equivalencias y alternativas de alimentos | `/dashboard/sustitutos` |

### 4. Herramientas Rápidas (Standalone)

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Entregable Rápido** | Generación rápida de planes sin seguir el flujo clínico de 4 etapas | `/dashboard/rapido` |
| **Recetas Rápido** | Generación IA de platos a partir de instrucciones en lenguaje natural | `/dashboard/rapido/recetas` |
| **Herramientas** | Calculadoras clínicas: IMC, metabolismo basal, fórmulas nutricionales | `/dashboard/herramientas` |

### 5. Portal del Paciente

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Portal Paciente** | Interfaz externa donde pacientes ven sus planes y registran progreso | `/portal` |
| **Link de Citas** | Pacientes pueden agendar citas desde link público compartido | `/portal/citas/[nutriId]/[token]` |
| **Login Paciente** | Acceso independiente para pacientes | `/portal/login` |

### 6. Administración y Cuenta

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Dashboard Admin** | Panel de control general: cuentas, métricas, gestión del sistema | `/dashboard/admin` |
| **Feedback y Soporte** | Canal para reporte de bugs y solicitudes de features | `/dashboard/feedback` |
| **Actualizaciones** | Changelog de la plataforma y anuncios de nuevas funcionalidades | `/dashboard/actualizaciones` |
| **Configuraciones** | Perfil de usuario, configuraciones de clínica y preferencias | `/dashboard/configuraciones` |

### 7. Base de Datos y Cálculos

| Funcionalidad | Descripción |
|---------------|-------------|
| **Base de Ingredientes Chile** | 500+ ingredientes con valores nutricionales específicos de Chile |
| **Fórmulas Nutricionales** | Cálculos automáticos: IMC, peso ideal, metabolismo basal, necesidades calóricas |
| **Intercambio de Porciones** | Sistema de equivalencias y substituciones de porciones |

---

## FUNCIONALIDADES FUTURAS (Por Construir)

### Monetización y Pagos

| Funcionalidad | Descripción |
|---------------|-------------|
| **Boletas Electrónicas** | Integración con SII para boletas automáticas |
| **Links de Pago / Webpay** | Pasarela de pago online (Transbank/Webpay) |
| **Pagos Anticipados** | Sistema de pagos por adelantado |
| **Pagos Mensuales** | Facturación mensual automática |
| **Tap to Pay** | Pagos presenciales |
| **Pagos en Dólares** | Soporte multi-moneda |
| **Comisiones** | Sistema de comisiones por transacción |

### Integraciones y Automatizaciones

| Funcionalidad | Descripción |
|---------------|-------------|
| **WhatsApp IA** | Automatización de comunicación con pacientes por WhatsApp con IA |
| **Recordatorios WhatsApp** | Envío automático de recordatorios de citas por WhatsApp |
| **Google Calendar** | Integración con Google Calendar para sincronización de eventos |
| **Google Meet** | Generación automática de enlaces de videollamada |
| **Integración Fonasa** | Compatibilidad con sistema Fonasa |
| **Email/SMS Marketing** | Campañas de email/SMS (300-5000/mes) |

### Portal Público y Visibilidad

| Funcionalidad | Descripción |
|---------------|-------------|
| **Perfil Público Profesional** | Página pública SEO del nutricionista (tipo Doctoralia) |
| **Reserva con Google** | Integración con Google para reservas online |
| **Vitrina (cursos, ebooks)** | Marketplace para que nutricionistas vendan productos digitales |
| **Red Social de Nutricionistas** | Comunidad profesional, publicaciones, recomendaciones, derivaciones |

### App Móvil

| Funcionalidad | Descripción |
|---------------|-------------|
| **App Móvil Profesional** | App para que nutricionistas gestionen desde el celular |
| **App Móvil Paciente** | App para pacientes |

### Experiencia y Retención

| Funcionalidad | Descripción |
|---------------|-------------|
| **Telemedicina / Videollamadas** | Consultas por videollamada integradas |
| **Lista de Espera Inteligente** | Gestión automática de lista de espera |
| **Paquetes de Sesiones** | Venta de paquetes de múltiples consultas |
| **Notificaciones Push** | Alertas en tiempo real |
| **Noa Notes (AI notas)** | Asistencia IA para tomar notas de consultas |

### Gestión de Pacientes Avanzada

| Funcionalidad | Descripción |
|---------------|-------------|
| **Importador CSV** | Importación masiva de pacientes desde archivos CSV/Excel |
| **Wizard de Onboarding** | Flujo guiado de 5 pasos para nuevos nutricionistas |
| **Plantillas por Especialidad** | Plantillas de fichas clínicas personalizadas |
| **Certificación CENS** | Certificación de ficha clínica |
| **Recetas Médicas** | Generación de recetas médicas |

### Dashboard y Analytics

| Funcionalidad | Descripción |
|---------------|-------------|
| **Estadísticas Avanzadas** | Dashboard completo de métricas y analytics |
| **Reports de Ingresos** | Reportes de ingresos y ganancias |
| **Métricas de Retención** |Tracking de retención de pacientes |

###IA y Automatización Clínica

| Funcionalidad | Descripción |
|---------------|-------------|
| **Detección Automática de Restricciones** | IA que detecta restricciones alimentarias desde historial médico |
| **Sugerencia de Mejoras IA** | IA que sugiere mejoras en planes nutricionales |
| **Análisis de Progreso IA** | IA que analiza el progreso del paciente y sugiere ajustes |

---

## LÍMITES POR PLAN (Ejemplo Referencia)

| Feature | FREE | PRO | PREMIUM |
|---------|------|-----|---------|
| Pacientes | 5 | 50 | ∞ |
| Consultas/mes | 10 | 100 | ∞ |
| Entregables PDF | 5 | 50 | ∞ |
| Recetas IA | 10 | 100 | ∞ |
| Ingredientes base | ✓ | ✓ | ✓ |
| Portal Paciente | ✗ | ✓ | ✓ |
| Citas | ✗ | ✓ | ✓ |
| Boletas electrónicas | ✗ | ✗ | ✓ |
| WhatsApp IA | ✗ | ✗ | ✓ |
| App Móvil | ✗ | ✗ | ✓ |
| Red Social | ✗ | ✗ | ✓ |
