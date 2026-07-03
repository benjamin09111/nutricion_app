# Guía Maestra: Implementación de Kapso (WhatsApp Cloud API)

Esta guía documenta el paso a paso detallado para implementar y configurar **Kapso** en cualquier proyecto Node.js / Next.js. El objetivo principal en este nuevo proyecto será **notificar al dueño del negocio de forma inmediata** cuando un usuario realice ciertas acciones clave (por ejemplo, registrar un nuevo pedido o enviar un formulario).

---

## 📋 Requisitos Previos y Credenciales

Para interactuar con Meta a través del API de Kapso, necesitas obtener las siguientes credenciales en tu panel de Kapso:

1. **`KAPSO_API_KEY`**: Clave de API privada generada desde la plataforma de Kapso.
2. **`KAPSO_PHONE_NUMBER_ID`**: Identificador único del número de teléfono asignado en Meta.
3. **`KAPSO_WABA_ID`**: Identificador de la cuenta comercial de WhatsApp (WhatsApp Business Account ID).
4. **`KAPSO_WEBHOOK_SECRET`**: Clave secreta para firmar y verificar la autenticidad de los webhooks entrantes (opcional pero muy recomendado).

---

## 🛠️ Paso 1: Instalación de Dependencias

Instala el SDK oficial de Kapso en el nuevo proyecto usando tu gestor de paquetes de preferencia:

```bash
npm install @kapso/whatsapp-cloud-api
```

---

## ⚙️ Paso 2: Configuración de Variables de Entorno

Agrega las siguientes variables en tu archivo `.env.local` o archivo de configuración de entorno correspondiente:

```env
# Configuración de Kapso (WhatsApp Cloud API)
KAPSO_API_KEY=tu_api_key_aqui
KAPSO_PHONE_NUMBER_ID=tu_phone_number_id_aqui
KAPSO_WABA_ID=tu_waba_id_aqui
KAPSO_WEBHOOK_SECRET=tu_webhook_secret_aqui
```

---

## 📦 Paso 3: Servicio Centralizador de WhatsApp (`whatsapp.service.ts`)

Crea un servicio modular encargado de instanciar el cliente de Kapso y proveer funciones seguras para enviar mensajes de texto y plantillas (Templates).

Crea el archivo en `src/services/whatsapp/whatsapp.service.ts` (o estructura equivalente):

```typescript
import { WhatsAppClient, buildTemplateSendPayload } from '@kapso/whatsapp-cloud-api';

export interface WhatsAppTextMessageInput {
  to: string;
  body: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppTemplatePayload {
  name: string;
  languageCode?: string;
  parameters: Array<{
    type: 'text';
    text: string;
    parameterName?: string; // Requerido para parámetros con nombre (Named parameters)
  }>;
}

let client: WhatsAppClient | null = null;

/**
 * Obtiene o inicializa la instancia única del cliente de Kapso.
 */
function getClient(): WhatsAppClient {
  if (!client) {
    if (!process.env.KAPSO_API_KEY) {
      throw new Error('Missing KAPSO_API_KEY environment variable.');
    }
    client = new WhatsAppClient({
      baseUrl: 'https://app.kapso.ai/api/meta/',
      kapsoApiKey: process.env.KAPSO_API_KEY,
    });
  }
  return client;
}

/**
 * Envía un mensaje de texto simple de WhatsApp.
 * NOTA: Esto solo funciona si el destinatario ya inició una conversación con el número
 * en las últimas 24 horas (Ventana de Servicio al Cliente).
 */
export async function sendWhatsAppText(
  input: WhatsAppTextMessageInput
): Promise<WhatsAppSendResult> {
  try {
    const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
    if (!phoneNumberId) throw new Error('Missing KAPSO_PHONE_NUMBER_ID');

    const response = await getClient().messages.sendText({
      phoneNumberId,
      to: input.to,
      body: input.body,
    });

    return {
      success: true,
      messageId: response.messages[0]?.id,
    };
  } catch (error) {
    console.error('[WhatsApp] Error enviando mensaje de texto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Envía una plantilla (Template) pre-aprobada por Meta.
 * Ideal para notificaciones transaccionales a usuarios y al dueño.
 */
export async function sendWhatsAppTemplate(
  to: string,
  payload: WhatsAppTemplatePayload
): Promise<WhatsAppSendResult> {
  try {
    const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
    if (!phoneNumberId) throw new Error('Missing KAPSO_PHONE_NUMBER_ID');

    // Mapear parámetros del template
    const bodyParams = payload.parameters.map(param => ({
      type: 'text' as const,
      text: param.text,
      ...(param.parameterName ? { parameterName: param.parameterName } : {}),
    }));

    const code = payload.languageCode || 'es';

    const templatePayload = buildTemplateSendPayload({
      name: payload.name,
      language: code,
      body: bodyParams,
    });

    const response = await getClient().messages.sendTemplate({
      phoneNumberId,
      to,
      template: templatePayload,
    });

    return {
      success: true,
      messageId: response.messages[0]?.id,
    };
  } catch (error) {
    console.error('[WhatsApp] Error enviando plantilla:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
```

---

## 📝 Paso 4: Creación de Plantillas en Meta

WhatsApp requiere el uso de plantillas (Templates) para iniciar conversaciones salientes. Para enviar alertas al dueño del negocio, crea una plantilla en tu consola de Kapso/Meta con la siguiente estructura recomendada:

* **Nombre de la Plantilla**: `nuevo_pedido_dueno` (o similar)
* **Categoría**: `UTILITY` (Servicios públicos / Transaccional)
* **Idioma**: `es` (Español)
* **Formato de Parámetros**: `NAMED` (Parámetros con nombre, más legible)
* **Texto del Cuerpo**:
  ```text
  ¡Hola! Tienes un nuevo pedido en tu tienda.
  
  📦 Pedido: {{numero_pedido}}
  👤 Cliente: {{nombre_cliente}}
  💰 Total: {{monto_total}}
  📞 Teléfono: {{telefono_cliente}}
  
  Por favor ingresa al panel administrativo para gestionarlo.
  ```

---

## 🔔 Paso 5: Implementación de Notificaciones de Eventos (Ejemplo: Nuevo Pedido)

Ahora, en tu código de servidor (como Server Actions, Handlers de API o funciones del sistema de base de datos) donde ocurre el evento (ej: el usuario presiona "Comprar"), agrega la llamada de notificación al dueño.

```typescript
import { sendWhatsAppTemplate } from '@/services/whatsapp/whatsapp.service';

interface OrderEventData {
  orderId: string;
  customerName: string;
  totalAmount: number;
  customerPhone: string;
}

/**
 * Función que se ejecuta cuando un cliente realiza una compra.
 * Notifica de inmediato al dueño del negocio mediante WhatsApp.
 */
export async function notifyOwnerOnNewOrder(
  order: OrderEventData,
  ownerPhoneNumber: string // El número debe incluir código de país sin el signo +, ej: "56912345678"
) {
  // Asegúrate de formatear el número correctamente
  const formattedOwnerPhone = ownerPhoneNumber.replace(/\+/g, '').trim();

  const templatePayload = {
    name: 'nuevo_pedido_dueno', // Nombre exacto del template aprobado
    languageCode: 'es',
    parameters: [
      { type: 'text' as const, text: order.orderId, parameterName: 'numero_pedido' },
      { type: 'text' as const, text: order.customerName, parameterName: 'nombre_cliente' },
      { type: 'text' as const, text: `$${order.totalAmount.toLocaleString()}`, parameterName: 'monto_total' },
      { type: 'text' as const, text: order.customerPhone, parameterName: 'telefono_cliente' },
    ],
  };

  console.log(`[Notification] Enviando alerta de pedido ${order.orderId} al dueño: ${formattedOwnerPhone}`);
  
  const result = await sendWhatsAppTemplate(formattedOwnerPhone, templatePayload);

  if (result.success) {
    console.log(`[Notification] Alerta enviada exitosamente. ID: ${result.messageId}`);
  } else {
    console.error(`[Notification] Error al enviar alerta de WhatsApp al dueño: ${result.error}`);
  }
}
```

Puedes replicar este patrón para otros eventos (por ejemplo: `alguien_se_registro`, `consulta_contacto_urgente`, etc.), creando la plantilla respectiva en la consola de Kapso y mapeando los parámetros apropiadamente.

---

## 🔗 Paso 6: Configuración de Webhooks (Control de Estados y Respuestas)

Si deseas recibir estados de entrega (`sent`, `delivered`, `read`, `failed`) o interactuar si el dueño responde al mensaje, configura un webhook en Next.js.

Crea el archivo `/src/app/api/webhooks/kapso/route.ts`:

```typescript
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Valida que la petición provenga auténticamente de Kapso usando firma HMAC SHA-256.
 */
function verifySignature(rawBody: string, signature: string | null, secret?: string) {
  if (!secret) return true; // Si no hay secreto configurado, se salta la verificación (no recomendado en prod)
  if (!signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return signature === expected || signature === `sha256=${expected}`;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    const signature = request.headers.get('x-webhook-signature');
    const event = request.headers.get('x-webhook-event') || '';

    // Verificar firma de seguridad
    if (!verifySignature(rawBody, signature, process.env.KAPSO_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');

    // Procesar evento de mensaje recibido
    if (event === 'whatsapp.message.received') {
      const message = payload.message;
      const from = message?.from; // Teléfono de quien envía
      const body = message?.text?.body || message?.content || '';

      console.log(`[Webhook] Mensaje recibido de ${from}: "${body}"`);

      // TODO: Aquí puedes procesar comandos rápidos si el dueño responde (ej: "Aceptar pedido")
      
      return NextResponse.json({ status: 'ok' });
    }

    // Procesar actualizaciones de entrega
    if ([
      'whatsapp.message.sent',
      'whatsapp.message.delivered',
      'whatsapp.message.read',
      'whatsapp.message.failed'
    ].includes(event)) {
      const messageId = payload.message?.id;
      const status = event.replace('whatsapp.message.', '');
      
      console.log(`[Webhook] Mensaje ${messageId} actualizado a estado: ${status}`);

      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    console.error('[Webhook Error] Error procesando webhook de Kapso:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'kapso-webhook-ready' });
}
```

---

## 🧪 Paso 7: Plan de Verificación

Para probar que la integración funciona correctamente de forma acelerada y paso a paso:

1. **Configura el entorno local**: Asegúrate de rellenar `.env.local` con credenciales reales.
2. **Crea la plantilla**: Registra `nuevo_pedido_dueno` en el panel de Kapso y espera a que cambie al estado `APPROVED` (normalmente toma menos de 2 minutos).
3. **Prueba local**: Llama a la función `notifyOwnerOnNewOrder` desde un script de prueba o un botón temporal en tu UI de desarrollo.
4. **Verificación de número**: Asegúrate de que el número del dueño tenga formato internacional completo (ej: `56912345678` para Chile, `34612345678` para España) y de que el número esté habilitado para recibir mensajes de WhatsApp.
5. **Monitorea los Webhooks**: Si tienes expuesto tu servidor local mediante un tunel (como `ngrok` o `localtunnel`), configura la URL del webhook en el panel de Kapso (`https://tu-dominio.ngrok-free.app/api/webhooks/kapso`) para confirmar la llegada del evento `whatsapp.message.delivered`.
