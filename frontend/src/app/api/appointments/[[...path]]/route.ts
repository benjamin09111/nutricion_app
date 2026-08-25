import { NextRequest, NextResponse } from "next/server";
import { resolveRequiredUrl } from "@/lib/runtime-url.util";

const getBackendBaseUrl = () =>
  resolveRequiredUrl(
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
  );

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
  const baseUrl = getBackendBaseUrl();

  const incomingUrl = new URL(request.url);
  const target = new URL(baseUrl);

  const routePath = pathSegments?.length ? `/${pathSegments.join("/")}` : "";
  target.pathname = `${target.pathname.replace(/\/$/, "")}${routePath}`;
  target.search = incomingUrl.search;

  return target;
};

// SEGURIDAD: allowlist, nunca blocklist.
// Antes se reenviaba `new Headers(request.headers)` completo, así que cualquier
// navegador podía inyectar `x-api-key`, `x-nutritionist-id` (suplantando a otro
// nutricionista) o `x-forwarded-for` (falseando la IP que usa el rate limiting,
// porque el backend corre con `trust proxy`). Sólo pasa lo imprescindible.
const FORWARDED_REQUEST_HEADERS = [
  "cookie",
  "content-type",
  "accept",
  "accept-language",
] as const;

async function proxyRequest(request: NextRequest, context: ProxyContext) {
  const params = await resolveParams(context);
  const target = buildTargetUrl(request, params.path);

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const tenantId = getTenantId();

  if (tenantId) {
    headers.set("X-Tenant-ID", tenantId);
  }

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
