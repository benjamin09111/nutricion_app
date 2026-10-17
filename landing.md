# 🚀 NutriNet: Especificación de Funcionalidades y Matriz Comparativa para Landing Page

## 📌 Contexto Estratégico para la Landing Page

Página de conversión B2B dirigida a nutricionistas independientes, clínicos y deportivos de Chile. **Objetivo principal:** Transformar la percepción de "un software más" a "la herramienta indispensable que devuelve la calidad de vida al profesional y garantiza la adherencia del paciente".

---

## ⚡ 1\. Matriz Comparativa de Alto Impacto: "Sin NutriNet vs. Con NutriNet"

| Dimensión de la Consulta               | ❌ Método Tradicional (Sin NutriNet)                                                        | ✅ Con NutriNet (Plataforma SaaS + IA Agéntica)                                                        | Impacto / Beneficio Clave                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Tiempo por Pauta Nutricional**       | **45 a 60 minutos** calculando TMB, GET y cuadrando porciones a mano en Excel.              | **5 minutos** con cálculo bio-matemático instantáneo y autocompletado asistido por IA.                 | **Ahorro del 88% del tiempo** (recupera tus noches y fines de semana).                        |
| **Prescripción Express**               | **Imposible.** Requiere citar a segunda sesión o enviar por correo horas después.           | **Módulo Rápido (3 min):** Genera y entrega pauta de 1 página descargable durante la consulta.         | Entregable inmediato que impresiona al paciente en la misma sesión.                           |
| **Base de Datos de Alimentos**         | **Bases desactualizadas o USDA (EE.UU.)** con ingredientes inexistentes en Chile.           | **Tabla Oficial INTA (U. de Chile 2018)**, precios ODEPA y marcas locales (Jumbo, Líder, Unimarc).     | **Cero alucinaciones:** 100% rigor científico e ingredientes reales del supermercado chileno. |
| **Diseño y Formato del Plan**          | **PDFs fríos y estáticos** en Word o Canva que el paciente traspapela o pierde en el email. | **Portal Interactivo PWA** accesible desde el móvil + PDF de diseño editorial.                         | Experiencia moderna, clara y accesible desde cualquier smartphone.                            |
| **Lista de Compras**                   | **Manual y confusa.** El paciente debe calcular gramos por su cuenta.                       | **Carrito Automático en 1 Clic:** Consolidación semanal organizada por pasillos de supermercado.       | Facilita la vida del paciente y ahorra dinero al evitar el desperdicio.                       |
| **Acompañamiento Interconsulta**       | **A ciegas.** WhatsApp disperso o cero contacto durante los 30 días entre citas.            | **Portal Interactivo PWA:** Check-ins diarios (agua, energía, fotos de platos, síntomas).              | **Visibilidad total:** Alerta temprana si el paciente entra en riesgo de deserción.           |
| **Soporte de Inteligencia Artificial** | **Sin IA** o uso de ChatGPT genérico que inventa porciones o alucina alimentos extranjeros. | **Copiloto Clínico "Naty la Nutria" (Human-in-the-Loop):** La IA sugiere; tú apruebas.                 | **Asistencia 24/7 invisible** donde el paciente solo ve la dedicación de su nutricionista.    |
| **Adquisición de Clientes**            | **Boca a boca informal** y batallas constantes con el marketing digital en Instagram.       | **Matchmaking Inteligente B2B2C:** Formulario por presupuesto/meta que te deriva pacientes listos.     | **Aumento de ingresos:** Pacientes calificados directo a tu agenda.                           |
| **Adherencia y Retención**             | **86% de deserción** de pacientes antes del año (DIPRES).                                   | **Reducción de deserción a &lt;30%** mediante acompañamiento continuo y pautas dinámicas.              | Pacientes fieles que vuelven a reconsulta y recomiendan tu servicio.                          |
| **Higiene Legal y Datos**              | **Riesgo normativo** por usar Excel/Google Drive sin encriptación médica.                   | **Cumplimiento estricto** de Leyes 19.628, 21.719 y 20.584 de Protección de Datos Personales en Chile. | Seguridad jurídica total y cifrado de grado clínico (AES-256).                                |

---

## 🛠️ 2\. Desglose Módulo por Módulo para el Apartado de "Funcionalidades Estrella"

### 🏛️ A. La Tubería Clínica Secuencial de 4 Etapas

1. **Etapa 1: Dieta (Planificación Bio-Matemática Instantánea)**

- Fórmulas validadas: Mifflin-St Jeor, Harris-Benedict, FAO/OMS.
- Ajustes automáticos por factor de actividad y objetivo corporal.
- Distribución de macronutrientes (gramos/porcentajes) y cuadraturas automáticas por porciones de intercambio INTA 2018.

2. **Etapa 2: Recetas &amp; Platos (Generación Asistida por IA)**

- Autocompletado inteligente de días y semanas (`aiFillDay`, `aiFillWeek`).
- Respeto estricto de alergias (celiaquía, APLV), aversiones y elecciones dietéticas (vegano, keto, vegetariano).
- Sustituciones equivalentes en 1 clic.

3. **Etapa 3: Carrito (Compras Inteligentes por Pasillos)**

- Agrupación matemática de todos los alimentos de la semana/mes.
- Categorización automática por pasillos de supermercado (Lácteos, Verduras, Abarrotes, Carnes/Proteínas).
- Estimación de costo canasta según precios de referencia ODEPA.

4. **Etapa 4: Entregable Premium &amp; Sincronización PWA**

- PDF descargable de calidad editorial con logo y firma digital del nutricionista.
- Despliegue inmediato al Portal del Paciente.

---

### 📱 B. Experiencia del Paciente (Portal PWA &amp; Acompañamiento)

- **Acceso Sin Contraseña:** Autenticación ultra-simple con código de 8 dígitos de un solo uso.
- **Check-ins Diarios Interactivos:** Registro amigable de hidratación en litros, estado de ánimo, energía, síntomas digestivos y fotos de platos.
- **Lista de Compras con Checkbox:** El paciente tacha los productos en el supermercado desde su teléfono.
- **Asistente Agéntico 24/7 ("Invisible AI"):** Resuelve dudas cotidianas sobre reemplazos de alimentos basándose **exclusivamente en el criterio definido por el nutricionista**.

---

### 🎯 C. Herramientas Especializadas &amp; CRM Clínico

- **Módulo Rápido Express (`/dashboard/rapido`):** Diseñado para consultas de alto flujo. Prescripción de 1 hoja descargable en 3 minutos.
- **Ficha Clínica 360° &amp; Historial SOAP:** Anamnesis alimentaria, antecedentes mórbidos, gineco-obstétricos y línea de tiempo de biomarcadores.
- **Antropometría Avanzada (Módulo Fitness):** Gráficos cronológicos de peso, porcentaje de grasa, masa muscular, pliegues cutáneos e IMC.
- **Tamizajes Nutricionales Integrados:** MNA (Adultos Mayores), MUST (Desnutrición Ambulatoria) y NRS-2002 (Hospitalizados).
- **Matchmaking &amp; Perfil SEO (`/nutricionistas/[slug]`):** Posicionamiento en el directorio público nacional de NutriNet para captar pacientes según objetivo y presupuesto.
- **Sincronización de Agenda:** Integración bidireccional con Google Calendar y WhatsApp Cloud API.

---

## 💡 3\. Mensajes Clave para los CTAs (Call to Action) de la Landing Page

1. **CTA Principal (Hero Section):**  
   &gt; `[ Comenzar Mi Prueba Gratis de 14 Días ]`  
   &gt; _Sin tarjeta de crédito • Diseña tu primera pauta en 5 minutos • Válido para los primeros 50 nutricionistas._
2. **CTA Secundario (Eficiencia y Recuperación de Tiempo):**  
   &gt; `[ Ver Demostración del Copiloto IA ]`  
   &gt; _Descubre cómo ahorrar 15 horas a la semana sin perder el control clínico de tus pacientes._
3. **CTA de Garantía Early Adopter:**  
   &gt; `[ Unirme a la Red NutriNet con 50% Dcto. Permanente ]`  
   &gt; _Oferta de Lanzamiento Exclusiva para Primeros Suscriptores._
