import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  patientContext?: {
    fullName?: string;
    age?: number;
    gender?: "F" | "M";
    weight?: number;
    height?: number;
    goal?: string;
    clinicalDiagnosis?: string;
    restrictions?: string[];
    region?: string;
  };
  modelId?: string;
}

const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";

export async function POST(req: Request) {
  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages } = body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelId = body.modelId || DEFAULT_MODEL;

  const systemPrompt = `Eres "Naty la Nutria", la copiloto clínica oficial y mascota de NutriNet.
Eres una asistente chilena cálida, altamente técnica, rigurosa y experta en nutrición clínica y en el Sistema Chileno de Porciones de Intercambio del INTA (Universidad de Chile).
Te comunicas de colega a colega con la nutricionista tratante. Usas un tono profesional, cercano, con toques chilenos sobrios y respetuosos (ej: "¡Hola colega!", "Ten ojo con...", "Según las tablas del INTA...").

REGLAS DE ORO DE NATY:
1. Tu misión principal es responder dudas nutricionales, equivalencias de porciones según el INTA, cuadratura de macronutrientes, propiedades de alimentos chilenos y diseño de planes alimentarios.
2. Habla de las porciones en medidas caseras oficiales del INTA (1/2 marraqueta, 1/2 taza de avena, 3 cdas de palta, 1 taza de leche descremada, etc.).
3. Sé concisa y directa al grano (máximo 2 a 3 párrafos cortos y claros). Evita emojis informales, no uses caracteres de teclado. No inventes datos ficticios ni supongas que estás hablando de un paciente específico a menos que la nutricionista te lo pida explícitamente en su mensaje.`;

  // Fallback responses if OpenRouter is unreachable or rate-limited
  const getFallbackResponse = (lastUserMsg: string): string => {
    const q = lastUserMsg.toLowerCase();
    if (q.includes("cena") || q.includes("cocinar") || q.includes("comida")) {
      return `Para una cena rápida y balanceada con porciones del INTA, te sugiero la siguiente distribución: 1 porción de carnes bajas en grasa (ej. 1 lata chica de atún al agua o 60 g de pechuga de pollo), 2 porciones de verduras de libre consumo y 1 porción de verduras generales (ej. ensalada mixta de espinaca con tomate), 1 porción de aceites y grasas saludables (ej. 3 cucharadas de palta hass o 1 cucharadita de aceite de oliva), y 1 porción de cereales (ej. 1/2 taza de quinoa cocida o 1/2 marraqueta tostada). Aporta ~320 kcal con 24 g de proteína de alto valor biológico y excelente saciedad.`;
    }
    if (q.includes("marraqueta") || q.includes("reemplaz") || q.includes("pan") || q.includes("equivalen")) {
      return `En el sistema de porciones de intercambio del INTA, 1/2 marraqueta (50 g) equivale exactamente a 1 porción del grupo Cereales, Papas y Leguminosas Frescas (140 kcal, 30 g de carbohidratos, 3 g de proteína y 1 g de grasa). Puedes reemplazarla por: 1/2 taza de avena tradicional en hojuelas (40 g), 3/4 taza de arroz o fideos cocidos (100 g), 1 papa regular cocida (150 g), o 2 rebanadas de pan de molde integral.`;
    }
    if (q.includes("lacteo") || q.includes("leche") || q.includes("proteina") || q.includes("carne")) {
      return `En el sistema INTA, 1 porción de lácteos descremados aporta 70 kcal, 7 g de proteína, 10 g de carbohidratos y 0-2 g de lípidos (ej. 1 taza de leche descremada de 200 ml o 1 unidad de yogur dietético de 125 g). En cuanto a las carnes bajas en grasa, 1 porción aporta 65 kcal y 7 g de proteína de alto valor biológico (ej. 50 g de posta negra o 60 g de pechuga de pollo/pavo).`;
    }
    return `¡Hola colega! Soy Naty la Nutria, tu copiloto clínico en NutriNet. Estoy aquí para asistirte con el cálculo de requerimientos, equivalencias de porciones del INTA (Universidad de Chile), sugerencias de alimentos chilenos y cuadratura de pautas nutricionales. ¿En qué puedo ayudarte hoy?`;
  };

  const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";

  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({
      content: getFallbackResponse(lastUserMsg),
      model: "naty-local-engine",
    });
  }

  try {
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl",
        "X-Title": "NutriNet Demo Jump Chile 2026",
      },
      body: JSON.stringify({
        model: modelId,
        messages: formattedMessages,
        max_tokens: 450,
        temperature: 0.4,
        provider: {
          zdr: true,
          data_collection: "deny",
        },
      }),
      signal: AbortSignal.timeout(9000),
    });

    if (!response.ok) {
      console.warn("OpenRouter Naty Chat returned status:", response.status);
      return NextResponse.json({
        content: getFallbackResponse(lastUserMsg),
        model: "naty-fallback (INTA)",
      });
    }

    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({
        content: getFallbackResponse(lastUserMsg),
        model: "naty-fallback (INTA)",
      });
    }

    return NextResponse.json({
      content: reply,
      model: json.model || modelId,
      usage: json.usage,
    });
  } catch (err) {
    console.warn("Naty Chat network error, using fallback:", err);
    return NextResponse.json({
      content: getFallbackResponse(lastUserMsg),
      model: "naty-fallback (INTA)",
    });
  }
}

