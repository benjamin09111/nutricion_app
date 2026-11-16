"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api-base";

const ANONYMOUS_ID_KEY = "nutrinet_analytics_anonymous_id";

function getAnonymousId() {
  if (typeof window === "undefined") return undefined;
  const current = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (current) return current;
  const generated = `guest_${crypto.randomUUID()}`;
  window.localStorage.setItem(ANONYMOUS_ID_KEY, generated);
  return generated;
}

export function ProductAnalyticsProvider() {
  const pathname = usePathname();
  const startedAt = useRef<number>(0);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
      return;
    }

    const now = performance.now();
    const anonymousId = getAnonymousId();
    const send = (eventName: string, durationMs?: number) => {
      void fetchApi("/metrics/product-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventName,
          path: pathname,
          anonymousId,
          durationMs: durationMs ? Math.round(durationMs) : undefined,
        }),
      }).catch(() => undefined);
    };

    if (previousPath.current && startedAt.current > 0) {
      send("page_exit", now - startedAt.current);
    }

    previousPath.current = pathname;
    startedAt.current = now;
    send("page_view");
  }, [pathname]);

  return null;
}
