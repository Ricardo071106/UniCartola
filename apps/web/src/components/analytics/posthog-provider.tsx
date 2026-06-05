"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

let initialized = false;

function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (key) {
    posthog.init(key, { api_host: host, person_profiles: "identified_only" });
    initialized = true;
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  initPostHog();
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}
