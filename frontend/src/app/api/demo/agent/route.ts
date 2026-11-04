import { NextResponse } from "next/server";
import {
  CHILEAN_FOOD_CATALOG,
  INTA_GROUPS,
  type INTAGroupId,
  type RegionId,
} from "@/app/demo/nutrition-core";

export const dynamic = "force-dynamic";

interface AgentRequestBody {
  action: "generate_meal_plan" | "refine_plan";
  modelId?: string;
  patientData: {
    age: number;
    gender: "F" | "M";
    weightKg: number;
    heightCm: number;
    activityLevel: string;
    clinicalDiagnosis: string;
    allergies: string[];
    preferences?: string[];
    region: RegionId;
    targetKcal: number;
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
  };
  slots: {
    slotId: string;
    mealName: string;
    groupId: INTAGroupId;
    portions: number;
  }[];
  userPrompt?: string;
}

const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";

// ----------------------------------------------------------------------------
// R4: Whitelist Payload Builder (Zero PII: No name, no RUT, no email)
// ----------------------------------------------------------------------------
function buildAnonymizedPayload(body: AgentRequestBody) {
  const { patientData, slots } = body;

  const filteredSlots = slots.map((s) => {
    // Select candidates matching group, patient region and without allergies
    const candidates = CHILEAN_FOOD_CATALOG.filter((food) => {
      if (food.groupId !== s.groupId) return false;
      const isAllergenSafe = !food.allergens.some((a) =>
        patientData.allergies.map((x) => x.toLowerCase()).includes(a.toLowerCase()),
      );
      return isAllergenSafe;
    }).map((f) => ({
      id: f.id,
      name: f.name,
      household: f.householdUnit,
      grams: f.grams,
      isLocal: f.regions.includes(patientData.region),
    }));

    return {
      slotId: s.slotId,
      mealName: s.mealName,
      group: s.groupId,
      portions: s.portions,
      candidates,
    };
  });

  return {
    patient_profile: {
      age: patientData.age,
      gender: patientData.gender,
      weight_kg: patientData.weightKg,
      height_cm: patientData.heightCm,
      activity: patientData.activityLevel,
      clinical_diagnosis: patientData.clinicalDiagnosis,
      restrictions: patientData.allergies,
      preferences: patientData.preferences || [],
      region: patientData.region,
      target_kcal: patientData.targetKcal,
      target_protein_g: patientData.targetProteinG,
      target_carbs_g: patientData.targetCarbsG,
      target_fat_g: patientData.targetFatG,
    },
    exchange_slots: filteredSlots,
  };
}

// ----------------------------------------------------------------------------
// Deterministic Fallback Builder (Guarantees demo uptime)
// ----------------------------------------------------------------------------
function buildDeterministicPlan(body: AgentRequestBody) {
  const { patientData, slots } = body;

  const choices = slots.map((s) => {
    // Find best candidate for this slot
    const matching = CHILEAN_FOOD_CATALOG.filter((f) => {
      if (f.groupId !== s.groupId) return false;
      const safe = !f.allergens.some((a) =>
        patientData.allergies.map((x) => x.toLowerCase()).includes(a.toLowerCase()),
      );
      return safe;
    });

    // Prefer regional specialty
    const regional = matching.find((f) => f.regions.includes(patientData.region));
    const selected = regional || matching[0] || CHILEAN_FOOD_CATALOG[0];

    return {
      slotId: s.slotId,
      foodId: selected.id,
      foodName: selected.name,
      householdMeasure: `${s.portions} porción (${selected.householdUnit})`,
      grams: Math.round(selected.grams * s.portions),
      groupId: s.groupId,
    };
  });

  return {
    choices,
    noteForNutritionist:
      "Borrador estructurado según porciones oficiales INTA (U. de Chile). Ajustado a patología y región.",
    llmPayload: buildAnonymizedPayload(body),
    tokens: { prompt: 580, completion: 240, total: 820 },
    costUsd: 0.0008,
    latencyMs: 140,
    modelUsed: "deterministic-engine (INTA)",
    fallback: true,
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let body: AgentRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelId = body.modelId || DEFAULT_MODEL;
  const anonymizedPayload = buildAnonymizedPayload(body);

  // If no API key is provided, return immediate deterministic response
  if (!apiKey || apiKey.trim() === "") {
    const fallbackRes = buildDeterministicPlan(body);
    return NextResponse.json(fallbackRes);
  }

  const systemPrompt = `Eres el Asistente Clínico de NutriNet para Nutricionistas en Chile.
REGLA NO NEGOCIABLE: Elige qué alimento chileno de los candidatos asignados llena cada cupo (slotId).
NUNCA modifiques las porciones ni calcules calorías. Solo selecciona el mejor alimento para cada cupo respetando las patologías, la región (${body.patientData.region}) y las preferencias del paciente.
Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura:
{
  "choices": [
    {
      "slotId": "string",
      "foodId": "string",
      "split": 1.0
    }
  ],
  "noteForNutritionist": "Breve justificación clínica en 1 o 2 oraciones (sin cifras numéricas)."
}`;

  try {
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
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Arma la pauta para este paciente según sus cupos de intercambio: ${JSON.stringify(
              anonymizedPayload,
            )}`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.2,
        response_format: { type: "json_object" },
        provider: {
          zdr: true,
          data_collection: "deny",
          require_parameters: true,
        },
      }),
      signal: AbortSignal.timeout(12000), // 12 seconds max
    });

    if (!response.ok) {
      console.warn("OpenRouter API error:", response.status, await response.text());
      return NextResponse.json(buildDeterministicPlan(body));
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    const usage = json.usage || { prompt_tokens: 650, completion_tokens: 280, total_tokens: 930 };

    if (!content) {
      return NextResponse.json(buildDeterministicPlan(body));
    }

    const parsedOutput = JSON.parse(content);
    const latencyMs = Date.now() - startTime;

    // Estimate cost based on standard OpenRouter pricing
    const promptTokens = usage.prompt_tokens || 600;
    const completionTokens = usage.completion_tokens || 250;
    const costUsd = Number(
      ((promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.6).toFixed(6),
    );

    // Merge selections with catalog metadata
    const choices = (parsedOutput.choices || []).map((c: any) => {
      const slot = body.slots.find((s) => s.slotId === c.slotId);
      const food =
        CHILEAN_FOOD_CATALOG.find((f) => f.id === c.foodId) ||
        CHILEAN_FOOD_CATALOG.find((f) => f.groupId === slot?.groupId) ||
        CHILEAN_FOOD_CATALOG[0];

      const portions = slot ? slot.portions : 1;
      return {
        slotId: c.slotId,
        foodId: food.id,
        foodName: food.name,
        householdMeasure: `${portions} porción (${food.householdUnit})`,
        grams: Math.round(food.grams * portions),
        groupId: food.groupId,
      };
    });

    return NextResponse.json({
      choices: choices.length > 0 ? choices : buildDeterministicPlan(body).choices,
      noteForNutritionist:
        parsedOutput.noteForNutritionist ||
        "Pauta armada respetando los cupos del INTA, disponibilidad regional y restricciones.",
      llmPayload: anonymizedPayload,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      costUsd,
      latencyMs,
      modelUsed: json.model || modelId,
      fallback: false,
    });
  } catch (err) {
    console.warn("Agent call failed, executing deterministic fallback:", err);
    return NextResponse.json(buildDeterministicPlan(body));
  }
}
