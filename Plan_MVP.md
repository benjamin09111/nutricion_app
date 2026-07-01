# PLAN MVP - NUTRICION APP

## 1. MATRIZ COMPARATIVA DE FUNCIONALIDADES

### 1.1 Doctoralia (Starter $59k, Plus $69k, VIP $89k)

| Categoría | Feature | Status en tu app |
|-----------|---------|------------------|
| **Visibilidad** | Perfil en directorio Doctoralia | ❌ No tienen (no es marketplace) |
| | Reserva con Google | ❌ No tienen |
| | Perfil mejorado (First Class) | ❌ No tienen |
| | Solicitud de opiniones | ❌ No tienen |
| **Agenda** | Reserva online 24/7 | ✅ Ya tienen |
| | Lista de espera inteligente | ❌ No tienen |
| | Widgets omnicanal | ⚠️ Parcial |
| **Comunicación** | Recordatorios email/WhatsApp/SMS | ✅ Ya tienen |
| | Campañas email/SMS (300-5000/mes) | ❌ No tienen |
| **Clínica** | Expediente médico digital | ✅ Ya tienen |
| | Telemedicina/videoconsultas | ❌ No tienen |
| | Noa Notes (AI notas) | ❌ No tienen |
| **Administrativo** | Panel de control | ✅ Ya tienen |
| | Estadísticas avanzadas | ✅ Ya tienen (parcial) |
| **Marketing** | Web profesional (9.250 CLP/mes) | ❌ No tienen |
| | Media 360 (publicidad) | ❌ No tienen |

---

### 1.2 Encuadrado (Esencial $26k, Profesional $43k, Avanzado $141k)

| Categoría | Feature | Status en tu app |
|-----------|---------|------------------|
| **Agenda** | Agenda online flexible | ✅ Ya tienen |
| | Repetición de sesiones con 1 click | ✅ Ya tienen |
| | Bloques de horario | ✅ Ya tienen |
| | Límites diarios de sesiones | ✅ Ya tienen |
| | Vista semanal | ✅ Ya tienen |
| | App móvil | ⚠️ Deben verificar |
| **Cobros** | Pagos anticipados | ⚠️ Parcial |
| | Pagos mensuales | ⚠️ Parcial |
| | Tap to Pay (presencial) | ❌ No tienen |
| | Pagos en dólares | ❌ No tienen |
| | Links de pago | ❌ No tienen |
| | Comisiones 1-3% | ⚠️ Por implementar |
| **Facturación** | Boletas electrónicas automáticas | ❌ No tienen |
| | Facturas automáticas | ❌ No tienen |
| | Integración SII | ❌ No tienen |
| **Comunicación** | Recordatorios WhatsApp | ✅ Ya tienen |
| | Automatización WhatsApp IA | ❌ No tienen |
| | WhatsApp de confirmación | ❌ No tienen |
| | WhatsApp de evaluación | ❌ No tienen |
| **Fichas** | Ficha clínica digital | ✅ Ya tienen |
| | Certificación CENS | ❌ No tienen |
| | Plantillas por especialidad | ⚠️ Parcial |
| **Otros** | Paquetes de sesiones | ⚠️ Parcial |
| | Vitrina (cursos, ebooks) | ❌ No tienen |
| | Recetas médicas | ❌ No tienen |
| | Integración Fonasa | ❌ No tienen |
| | Portal de pacientes | ✅ Ya tienen |
| | Verificación registro profesional | ❌ No tienen |

---

### 1.3 Resumen: Features que YA tienen (diferenciadores)

| Feature | Doctoralia | Encuadrado | Tu App |
|---------|------------|------------|--------|
| **Generador de dietas automático** | ❌ | ❌ | ✅ |
| **Base de datos ingredientes Chile** | ❌ | ❌ | ✅ |
| **Portal paciente con tracking** | ❌ | ⚠️ | ✅ |
| **Gestión de recetas** | ❌ | ✅ | ❌ |
| **Generator de planes nutrition** | ❌ | ❌ | ✅ |
| **Export PDF de planes** | ❌ | ❌ | ✅ |

---

## 2. PRIORIZACIÓN: QUÉ IMPLEMENTAR

### 2.1 PRIORIDAD ALTA (Impacto en migración)

| # | Feature | Competidor | Por qué | Estimación |
|---|---------|------------|---------|------------|
| 1 | **Boletas electrónicas automáticas** | Ambos | Doctoralia no tiene, Encuadrado sí - blockers para profesionales | 2-3 semanas |
| 2 | **Links de pago / Webpay** | Ambos | Sin esto no pueden cobrar - obligatorio | 2 semanas |
| 3 | **Recordatorios WhatsApp automatizados** | Encuadrado | Ya tienen recordatorios, pero no automatización IA | 1 semana |
| 4 | **App móvil profesional** | Encuadrado | Encuadrado tiene app - algunos nutris prefieren gestionar desde móvil | 3-4 semanas |
| 5 | **Panel de estadísticas avanzadas** | Doctoralia VIP | Parcial, necesitan mejorar dashboard | 1 semana |

### 2.2 PRIORIDAD MEDIA (Diferenciación)

| # | Feature | Competidor | Por qué | Estimación |
|---|---------|-----------|---------|------------|
| 6 | **Vitrina (cursos, ebooks)** | Encuadrado | Revenue extra para nutris | 2 semanas |
| 7 | **Telemedicina / videollamadas** | Doctoralia | Importante post-COVID | 2 semanas |
| 8 | **Plantillas específicas nutrición** | - | Ya tienen pero mejorar | 1 semana |
| 9 | **Perfil público del profesional (SEO)** | Doctoralia | Visibilidad, aunque no sea marketplace | 2 semanas |
| 10 | **Integración Google Calendar** | - | Comodidad | 1 semana |

### 2.3 PRIORIDAD BAJA (Nice to have)

| # | Feature | Competidor | Por qué |
|---|---------|------------|---------|
| 11 | Recetas médicas | Encuadrado | Para otros profesionales, no nutris |
| 12 | Integración Fonasa | Encuadrado | Solo algunos nutris lo necesitan |
| 13 | Paquetes de sesiones | Encuadrado | Ya tienen algo similar |
| 14 | Certificación CENS | Encuadrado | Diferenciador de trust |
| 15 | Integración WhatsApp IA | Encuadrado | Solo plan avanzado |

---

## 3. CÓMO MEJORAR LO QUE INCLUYEN

### 3.1 Mejoras sobre Doctoralia

| Área | Doctoralia | Nuestra mejora |
|------|------------|----------------|
| **Precios** | $59-89k/mes | $35k PRO = **40-60% más barato** |
| **Datos** | Pacientes en SU plataforma | Pacientes en TU app, datos TUYOS |
| **Generator de dietas** | No tiene | ✅ Incluido |
| **Portal paciente** | Básico | Avanzado con tracking |
| **Base ingredientes** | No tiene | ✅ Chile-specific |

### 3.2 Mejoras sobre Encuadrado

| Área | Encuadrado | Nuestra mejora |
|------|------------|----------------|
| **Generator de dietas** | No tiene | ✅ Incluido |
| **Base ingredientes Chile** | No tiene | ✅ 500+ ingredientes |
| **Portal tracking** | Básico | Tracking completo peso/fotos/comidas |
| **Pacientes** | Genérico | Enfoque específico nutrición |
| **Precios** | $26-141k/mes | $35k PRO = competitivo |
| **Recursos** | Comunity, Academy | Generator, recipes, meal plans |

---

## 4. PROCESO DE MIGRACIÓN

### 4.1 Flujo actual vs Propuesto

**Actual (manual)**:
```
Nutri contacta → Llamada → Demo → Nutri exporta datos → Nosotros importamos → Setup → Listo
Tiempo: 1-2 semanas
```

**Propuesto (acelerado)**:
```
Nutri llega → Demo automatizada (video 5 min) → Auto-registro → Importador 1-click → Listo
Tiempo: 1-2 horas
```

### 4.2 Herramientas a construir

| Herramienta | Descripción | Prioridad |
|-------------|-------------|-----------|
| **Importador CSV/XLS** | Nutri sube archivo, sistema mapea y crea pacientes | ALTA |
| **Template de migración** | qué campos exportar de Doctoralia/Encuadrado | ALTA |
| **Wizard de onboarding** | 5 pasos: cuenta → agenda → pacientes → primer paciente → listo | ALTA |
| **Demo video interactiva** | Video que el nutri puede pausar y ver su cuenta ejemplo | MEDIA |
| **Bot de migración WhatsApp** | Flujo automatizado: "querés migrar? subí tu archivo" | BAJA |

### 4.3 Plan de migración detallado

**Fase 1 (Semana 1-2): Manual + estructurado**
- Crear guía de exportación para Doctoralia (capturas de pantalla)
- Crear guía de exportación para Encuadrado
- Crear template CSV con campos obligatorios
- Primeras 10 migraciones manual por ustedes

**Fase 2 (Semana 3-4): Semi-automatizado**
- Construir importador CSV
- Nutris sube archivo → preview → confirmar → importado
- Tiempo por migración: 15 min

**Fase 3 (Mes 2): Automatizado**
- Onboarding auto-guiado
- Video tutorial integrado
- Checklist de setup

---

## 5. ROADMAP SUGERIDO

### Mes 1: Essentials

| Semana | Tarea |
|--------|-------|
| 1-2 | ✅ Boletas electrónicas (SII) |
| 1-2 | ✅ Links de pago / Webpay |
| 3-4 | ✅ Mejora estadísticas dashboard |
| 3-4 | ✅ Importador CSV |

### Mes 2: Competitive

| Semana | Tarea |
|--------|-------|
| 1-2 | App móvil profesional |
| 1-2 | Perfil público (SEO) |
| 3-4 | Recordatorios WhatsApp mejorados |
| 3-4 | Template migración + guía |

### Mes 3: Diferenciación

| Semana | Tarea |
|--------|-------|
| 1-2 | Vitrina (cursos, ebooks) |
| 1-2 | Mejoras generator de dietas |
| 3-4 | Telemedicina (opcional) |
| 3-4 | Marketing de migración |

---

## 6. PREGUNTAS PARA CLARIFICAR

Antes de ejecutar, necesito saber:

1. **Presupuesto de desarrollo**: ¿Cuántas horas/semana pueden dedicar? ¿Tienen equipo o es 1 persona?

2. **Timeline**: ¿Quieren lanzar el marketing en 1 mes o más?

3. **Prioridad de features**: ¿Quieren priorizar migración (funcionalidad) o diferenciación (generator)?

4. **Infrastructure**: ¿Tienen capacidad de pagos (Webpay/Transbank) implementada o es nuevo?

5. **Facturación**: ¿Tienen integración con SII o es build from scratch?

---

## 7. RESUMEN EJECUTIVO

| Comparación | Doctoralia | Encuadrado | Tu App |
|-------------|-----------|------------|--------|
| **Precio** | $59-89k/mes | $26-141k/mes | FREE / $35k |
| **Generator dietas** | ❌ | ❌ | ✅ |
| **Base ingredientes** | ❌ | ❌ | ✅ |
| **Boletas automáticas** | ❌ | ✅ | ❌ |
| **Cobros online** | ❌ | ✅ | ❌ |
| **Portal paciente** | Básico | Básico | Avanzado |
| **App móvil** | ❌ | ✅ | ❌ |