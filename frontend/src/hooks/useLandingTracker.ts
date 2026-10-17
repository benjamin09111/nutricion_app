"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api-base";

const SESSION_STORAGE_KEY = "nutrinet_landing_session_id";
const REFERRER_STORAGE_KEY = "nutrinet_landing_initial_ref";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = "s_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "s_" + Date.now();
  }
}

export function useLandingTracker() {
  const [sessionId, setSessionId] = useState<string>("init");
  const hasTrackedPageView = useRef(false);

  useEffect(() => {
    const sId = getOrCreateSessionId();
    setSessionId(sId);

    // Capture initial referrer once per browser session
    let initialRef = "";
    try {
      initialRef = window.sessionStorage.getItem(REFERRER_STORAGE_KEY) || document.referrer || "";
      if (!window.sessionStorage.getItem(REFERRER_STORAGE_KEY) && document.referrer) {
        window.sessionStorage.setItem(REFERRER_STORAGE_KEY, document.referrer);
      }
    } catch {}

    // Track Page View on mount
    if (!hasTrackedPageView.current) {
      hasTrackedPageView.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const utm = {
        utm_source: urlParams.get("utm_source") || undefined,
        utm_medium: urlParams.get("utm_medium") || undefined,
        utm_campaign: urlParams.get("utm_campaign") || undefined,
        utm_content: urlParams.get("utm_content") || undefined,
      };

      fetchApi("/landing/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sId,
          eventType: "PAGE_VIEW",
          pagePath: window.location.pathname,
          referrer: initialRef,
          metadata: {
            screen: `${window.innerWidth}x${window.innerHeight}`,
            ...utm,
          },
        }),
      }).catch(() => {});
    }
  }, []);

  const trackEvent = useCallback(
    (eventType: string, metadata: Record<string, any> = {}) => {
      const sId = sessionId !== "init" ? sessionId : getOrCreateSessionId();
      fetchApi("/landing/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sId,
          eventType,
          pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
          metadata,
        }),
      }).catch(() => {});
    },
    [sessionId],
  );

  return { sessionId, trackEvent };
}
