"use client";

import { useEffect } from "react";
import { trackEvent } from "./posthog-provider";

export function SchoolPageTracker({ schoolSlug }: { schoolSlug: string }) {
  useEffect(() => {
    trackEvent("school_page_viewed", { school_slug: schoolSlug });
  }, [schoolSlug]);
  return null;
}
