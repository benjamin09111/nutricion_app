import { NextRequest, NextResponse } from "next/server";
import { resolveRequiredUrl } from "@/lib/runtime-url.util";

const getBackendBaseUrl = () =>
  resolveRequiredUrl(
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
  );

type ProxyContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: NextRequest, context: ProxyContext) {
  const { token } = await context.params;

  const target = new URL(
    `${getBackendBaseUrl()}/public/patient-intake/validate/${token}`,
  );

  try {
    const response = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Error de conexión con el servidor" },
      { status: 500 },
    );
  }
}
