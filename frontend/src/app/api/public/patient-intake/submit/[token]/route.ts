import { NextRequest, NextResponse } from "next/server";

const getBackendBaseUrl = () =>
  (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

type ProxyContext = {
  params: Promise<{ token: string }>;
};

export async function POST(
  request: NextRequest,
  context: ProxyContext,
) {
  const { token } = await context.params;
  const body = await request.json();

  const target = new URL(
    `${getBackendBaseUrl()}/public/patient-intake/submit/${token}`,
  );

  try {
    const response = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
