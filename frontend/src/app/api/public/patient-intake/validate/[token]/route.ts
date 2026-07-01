import { NextRequest, NextResponse } from "next/server";

const getBackendBaseUrl = () =>
  (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

type ProxyContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  request: NextRequest,
  context: ProxyContext,
) {
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
