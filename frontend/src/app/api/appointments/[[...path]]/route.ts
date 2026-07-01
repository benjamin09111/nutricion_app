import { NextRequest, NextResponse } from "next/server";

const getAppointmentsBaseUrl = () =>
  (process.env.APPOINTMENTS_API_BASE_URL || "").replace(/\/$/, "");

const getTenantId = () =>
  process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || "";

type ProxyContext = {
  params?: Promise<{ path?: string[] }> | { path?: string[] };
};

const resolveParams = async (context: ProxyContext) => {
  const params = context.params;

  if (params && typeof (params as Promise<unknown>).then === "function") {
    return (await params) as { path?: string[] };
  }

  return (params as { path?: string[] } | undefined) || {};
};

const buildTargetUrl = (request: NextRequest, pathSegments?: string[]) => {
  const baseUrl = getAppointmentsBaseUrl();
  if (!baseUrl) return null;

  const incomingUrl = new URL(request.url);
  const target = new URL(baseUrl);

  const routePath = pathSegments?.length ? `/${pathSegments.join("/")}` : "";
  target.pathname = `${target.pathname.replace(/\/$/, "")}${routePath}`;
  target.search = incomingUrl.search;

  return target;
};

async function proxyRequest(request: NextRequest, context: ProxyContext) {
  const params = await resolveParams(context);
  const target = buildTargetUrl(request, params.path);

  if (!target) {
    return NextResponse.json(
      { message: "APPOINTMENTS_API_BASE_URL no está configurada." },
      { status: 500 },
    );
  }

  const headers = new Headers(request.headers);
  const tenantId = getTenantId();

  if (tenantId) {
    headers.set("X-Tenant-ID", tenantId);
  }

  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(target, init);
  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers(response.headers);

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: ProxyContext) {
  return proxyRequest(request, context);
}
