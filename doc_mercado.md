# Documentación de Integración de Mercado Pago

Esta guía documenta cómo se implementó y estructuró la integración de **Mercado Pago** en esta aplicación Next.js. Está diseñada para que otro desarrollador o agente de Inteligencia Artificial pueda comprender el flujo e implementarlo en otro proyecto de manera directa.

---

## 🗺️ Arquitectura del Flujo de Pago

El flujo de pago es híbrido (Frontend + Backend + Webhooks) para garantizar la seguridad de las credenciales y la integridad de los datos de compra:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente (Frontend)
    participant API_Save as /api/save-payment
    participant API_Pref as /api/create-preference
    participant MP_API as Mercado Pago API
    participant Webhook as /api/mercadopago-webhook
    database DB as MongoDB
    participant WhatsApp as UltraMsg API

    Cliente->>Cliente: Llena formulario de envío y hace clic en "Ir a pagar"
    Cliente->>API_Save: POST con detalles del envío y carrito
    API_Save->>DB: Guarda orden de pago con código correlativo
    API_Save-->>Cliente: Retorna estado de guardado exitoso
    Cliente->>API_Pref: POST con datos del comprador y total a pagar
    Note over API_Pref: Genera preferencia usando el SDK de MP
    API_Pref->>MP_API: Crea preferencia con metadatos de la orden
    MP_API-->>API_Pref: Retorna Preferencia (init_point URL)
    API_Pref-->>Cliente: Retorna URL de pago (init_point)
    Cliente->>Cliente: Redirecciona a la pasarela de Mercado Pago
    Cliente->>MP_API: Realiza el pago
    MP_API-->>Cliente: Redirige a Success/Failure URL
    MP_API->>Webhook: Notificación POST (type: "payment")
    Webhook->>MP_API: Consulta estado del Pago por ID
    MP_API-->>Webhook: Retorna detalles del pago (status: approved)
    Webhook->>DB: Guarda el detalle definitivo aprobado en MongoDB
    Webhook->>WhatsApp: Envía notificación UltraMsg de confirmación
    Webhook-->>MP_API: Retorna 200 OK
```

---

## 📦 Dependencias Requeridas

Para replicar esta funcionalidad, asegúrate de instalar las siguientes dependencias oficiales en tu `package.json`:

```bash
# SDK de Mercado Pago para Node (Backend)
npm install mercadopago

# SDK de Mercado Pago para React (Frontend)
npm install @mercadopago/sdk-react

# Cliente HTTP para Webhooks (opcional, para notificaciones)
npm install axios
```

*Versiones de referencia en este proyecto:*
- `mercadopago`: `^2.4.0`
- `@mercadopago/sdk-react`: `^1.0.2`

---

## 🔑 Variables de Entorno (.env)

Debes definir las siguientes variables en tu archivo de configuración ambiental:

```env
# URL base de tu aplicación (para redirección de retornos)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Credenciales de Mercado Pago (Obtenidas de la consola de desarrolladores de MP)
NEXT_PUBLIC_MP_PUBLIC_KEY="APP_USR-XXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
MP_ACCESS_TOKEN="APP_USR-XXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXX-XXXXXXXX"

# Notificaciones por WhatsApp con UltraMsg (Opcional)
ULTRAMSG_TOKEN="tu_token_de_ultramsg"
ULTRAMSG_TO_PHONE="+569XXXXXXXX"
```

---

## 🏛️ Modelo de Base de Datos (Mongoose)

Se utiliza un modelo llamado `DetallePago` para almacenar las transacciones. Las compras se guardan antes de pagar y se ratifican tras recibir el webhook de aprobación.

**Archivo de Referencia:** [DetallePago.ts](file:///c:/Users/Benjamin/Desktop/freelancer_1/src/models/DetallePago.ts)

```typescript
import mongoose from "mongoose";

const DetallePagoSchema = new mongoose.Schema(
  {
    codigo: { type: Number, required: true, unique: true },
    nombre: String,
    email: String,
    direccion: String,
    numero_hogar: String,
    comuna: String,
    region: String,
    phone: String,
    tipo_delivery: String,
    isGuest: Boolean,
    productos: [
      {
        name: String,
        stock: Number,
        price: Number,
        subtotal: Number,
      },
    ],
    pago_total: Number,
    estado: String, // "pendiente", "enviado", "preparado", "cancelado"
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DetallePago || mongoose.model("DetallePago", DetallePagoSchema);
```

---

## 💻 Implementación en el Frontend

### 1. Inicialización del SDK
En tu componente principal o formulario de checkout, inicializa el SDK en un `useEffect` utilizando tu clave pública.

**Archivo de Referencia:** [AsideInfo.tsx](file:///c:/Users/Benjamin/Desktop/freelancer_1/src/components/home/profile/AsideInfo.tsx)

```typescript
import { initMercadoPago } from '@mercadopago/sdk-react';

useEffect(() => {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string;
  if (publicKey) {
    initMercadoPago(publicKey, {
      locale: 'es-CL', // Se ajusta al país objetivo (ej: es-CL para Chile, es-PE para Perú)
    });
  }
}, []);
```

### 2. Disparador del Pago en el Frontend
Al hacer clic en pagar, primero se envían los datos para persistir el carrito y luego se solicita al Backend crear la preferencia. Una vez obtenida la URL (`init_point`), se redirige al cliente.

**Archivo de Referencia:** [cart.ts (payMercadoPago)](file:///c:/Users/Benjamin/Desktop/freelancer_1/src/lib/api/cart.ts#L94-L125)

```typescript
export const payMercadoPago = async (
  locationData: any,
  delivery: number,
  toPay: number,
  cart: any[],
  session: any,
  setPaymentLoading: any,
  setMessagePayment: any
) => {
  if (!locationData.direction || !locationData.houseDepartmentNumber || !locationData.owner) {
    setMessagePayment("Por favor, ingrese toda la información requerida.");
    return;
  }

  setPaymentLoading(true);

  const dataInfo = {
    nombre: locationData.owner,
    email: session?.user.email,
    pago_total: toPay,
    tipo_delivery: delivery === 2000 ? "Normal (sábado)" : "Express ($4000)",
    direccion: locationData.direction,
    numero_hogar: locationData.houseDepartmentNumber,
    region: locationData.region,
    productos: cart,
  };

  // Crear preferencia en el backend
  const response = await fetch("/api/create-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataInfo),
  });

  const data = await response.json();
  if (data.init_point) {
    // Redirige al cliente al portal de pagos de Mercado Pago
    window.location.href = data.init_point;
  } else {
    alert("Error al generar el link de pago");
    setPaymentLoading(false);
  }
};
```

---

## ⚙️ Servicios y Endpoints en el Backend

### 1. Endpoint para Crear Preferencia (`/api/create-preference`)
Este endpoint privado inicializa la configuración de Mercado Pago con el token de acceso, recibe los datos del carrito, estructura la orden en un ítem consolidado e incluye los detalles de envío en el objeto `metadata` para que estén disponibles durante la verificación del webhook.

**Archivo de Referencia:** [create-preference/route.ts](file:///c:/Users/Benjamin/Desktop/freelancer_1/src/app/api/create-preference/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const mercadopago = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const preference = await new Preference(mercadopago).create({
      body: {
        items: [
          {
            id: "compra-general",
            title: "Compra en Organizarte",
            quantity: 1,
            unit_price: body.pago_total, // Valor total enviado desde frontend
          },
        ],
        payer: {
          name: body.nombre,
          email: body.email,
        },
        metadata: {
          direccion: body.direccion,
          numero_hogar: body.numero_hogar,
          region: body.region,
          tipo_delivery: body.tipo_delivery,
          productos: body.productos, // Pasamos el array de productos para recuperarlo luego
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pending`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({ init_point: preference.init_point });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    return NextResponse.json({ error: "Error interno al crear preferencia" }, { status: 500 });
  }
}
```

### 2. Endpoint del Webhook (`/api/mercadopago-webhook`)
Mercado Pago llama a este endpoint cada vez que cambia el estado de un pago. El webhook realiza una consulta segura al servidor de MP para validar la transacción, verifica que esté `approved`, guarda la información en la base de datos y opcionalmente dispara una alerta de WhatsApp al comercio.

> [!IMPORTANT]
> El webhook es asíncrono y se ejecuta de servidor a servidor. Esto asegura que la transacción se registre aunque el cliente cierre la pestaña antes de la redirección.

**Archivo de Referencia:** [mercadopago-webhook/route.ts](file:///c:/Users/Benjamin/Desktop/freelancer_1/src/app/api/mercadopago-webhook/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { connectDB } from "@/lib/mongodb";
import DetallePago from "@/models/DetallePago";
import axios from "axios";

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Solo actuar ante notificaciones de tipo "payment"
    if (body.type !== "payment") {
      return NextResponse.json({ message: "Notificación ignorada" }, { status: 200 });
    }

    const paymentId = body.data.id;

    // Obtener información del pago de forma segura desde los servidores de MP
    const payment = await new Payment(mercadopago).get({ id: paymentId });

    if (payment.status !== "approved") {
      return NextResponse.json({ message: "Pago aún no aprobado" }, { status: 200 });
    }

    const metadata = payment.metadata;
    const payer = payment.payer;

    await connectDB();

    // Registrar la compra confirmada
    const nuevoPago = new DetallePago({
      nombre: `${payer?.first_name || ""} ${payer?.last_name || ""}`.trim() || "Sin nombre",
      email: payer?.email || "Sin email",
      direccion: metadata.direccion,
      numero_hogar: metadata.numero_hogar,
      region: metadata.region,
      tipo_delivery: metadata.tipo_delivery,
      productos: metadata.productos,
      pago_total: payment.transaction_amount,
      estado: "preparado" // Configura el estado inicial del pedido aprobado
    });

    await nuevoPago.save();

    // Opcional: Enviar notificación vía WhatsApp (UltraMsg)
    const phone = process.env.ULTRAMSG_TO_PHONE;
    const text = `💸 NUEVO PAGO RECIBIDO\n\n🧑‍💻 Nombre: ${nuevoPago.nombre}\n📧 Email: ${nuevoPago.email}\n📍 Dirección: ${metadata.direccion} #${metadata.numero_hogar}, ${metadata.region}\n📦 Productos:\n${metadata.productos.map((p: any) => `- ${p.name} x${p.stock} = $${p.subtotal}`).join("\n")}\n\n💰 Total pagado: $${payment.transaction_amount}`;

    if (phone && process.env.ULTRAMSG_TOKEN) {
      await axios.get(`https://api.ultramsg.com/instanceYOUR_INSTANCE_ID/messages/chat`, {
        params: {
          token: process.env.ULTRAMSG_TOKEN,
          to: phone,
          body: text,
        },
      });
    }

    return NextResponse.json({ message: "Pago procesado y guardado correctamente" }, { status: 200 });
  } catch (error: any) {
    console.error("Error en webhook:", error);
    return NextResponse.json({ error: "Error procesando el pago" }, { status: 500 });
  }
}
```

---

## 🛠️ Pasos para Implementar en un Nuevo Proyecto

1. **Clonar Estructura**: Copia los endpoints `create-preference/route.ts` y `mercadopago-webhook/route.ts` en la ruta `/app/api/` de tu aplicación Next.js.
2. **Definir Variables de Entorno**: Obtén tus credenciales desde el panel de desarrollador de Mercado Pago y agrégalas al archivo `.env` del nuevo proyecto.
3. **Adaptar el Modelo de Datos**: Ajusta el modelo `DetallePago` (o el equivalente en tu base de datos) para que coincida con los campos de tu carrito y dirección.
4. **Actualizar el Webhook en el Dashboard**:
   - Registra tu URL de webhook en la consola de Mercado Pago: `https://tudominio.com/api/mercadopago-webhook`
   - Selecciona los eventos de tipo **Pagos (payments)**.
5. **Implementar el Frontend**: Utiliza la función `payMercadoPago` adaptando el formato de los datos de envío y la lista de artículos según la estructura requerida por tu backend.
