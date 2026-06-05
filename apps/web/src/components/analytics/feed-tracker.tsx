"use client";

import { useEffect } from "react";
import { trackEvent } from "./posthog-provider";

export function FeedTracker() {
  useEffect(() => {
    trackEvent("feed_viewed");
  }, []);
  return null;
}
