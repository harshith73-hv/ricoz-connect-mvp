// Shared (browser + server safe) webhook helpers.
export const DEMO_HOOK_ID = "dev-alerts-7f3a9c";
export const DEMO_API_KEY = "rcz_live_9Kx2mQ7vTn4Lp8Wd3Hs6Yb1R";

export type Severity = "info" | "success" | "warning" | "critical";

export type NormalizedEvent = {
  source: string;
  title: string;
  message: string;
  severity: Severity;
  link?: string | undefined;
};

type Json = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePayload(input: Json): NormalizedEvent {
  const p = input as any;
  // GitHub push
  if (p.ref && Array.isArray(p.commits)) {
    const repo = p.repository?.full_name;
    const pusher = p.pusher?.name;
    const commits = p.commits as any[];
    const branch = String(p.ref).replace("refs/heads/", "");
    return {
      source: "GitHub",
      title: `${str(pusher) ?? "Someone"} pushed ${commits.length} commit${commits.length === 1 ? "" : "s"} to ${branch}`,
      message: commits.map((c) => `• ${str(c.message) ?? ""}`).join("\n") || `Repository ${str(repo) ?? ""}`,
      severity: "info",
      link: str(p.compare),
    };
  }
  // Stripe-style payment event
  if (str(p.type)?.startsWith("payment") || str(p.type)?.startsWith("charge") || str(p.type)?.startsWith("invoice")) {
    const obj = (p.data?.object ?? {});
    const amount = typeof obj.amount === "number" ? (obj.amount / 100).toFixed(2) : "?";
    const currency = (str(obj.currency) ?? "usd").toUpperCase();
    const failed = str(p.type)!.includes("failed");
    return {
      source: "Stripe",
      title: failed ? `Payment failed: ${currency} ${amount}` : `Payment received: ${currency} ${amount}`,
      message: `${str(obj.customer_email) ?? "Customer"} — ${str(obj.description) ?? str(p.type)}`,
      severity: failed ? "critical" : "success",
    };
  }
  // Monitoring alert
  if (p.alert || p.monitor) {
    const sev = str(p.severity);
    return {
      source: str(p.source) ?? "Monitoring",
      title: str(p.alert) ?? str(p.monitor) ?? "Alert",
      message: str(p.message) ?? "",
      severity: sev === "critical" || sev === "warning" || sev === "success" ? sev : "warning",
      link: str(p.url),
    };
  }
  // Generic
  const sev = str(p.severity);
  return {
    source: str(p.source) ?? "Webhook",
    title: str(p.title) ?? "Incoming event",
    message: str(p.message) ?? str(p.text) ?? JSON.stringify(p).slice(0, 300),
    severity: sev === "critical" || sev === "warning" || sev === "success" ? sev : "info",
    link: str(p.url),
  };
}

export const SAMPLE_PAYLOADS: Record<string, { label: string; payload: Json }> = {
  github: {
    label: "GitHub push",
    payload: {
      ref: "refs/heads/main",
      compare: "https://github.com/ricoz/platform/compare/a1b2...c3d4",
      repository: { full_name: "ricoz/platform" },
      pusher: { name: "priya.n" },
      commits: [
        { message: "feat(billing): add proration for annual plans" },
        { message: "fix(auth): refresh token race on tab focus" },
      ],
    },
  },
  payment: {
    label: "Payment alert",
    payload: {
      type: "payment_intent.payment_failed",
      data: { object: { amount: 249900, currency: "usd", customer_email: "ops@acme-corp.com", description: "Enterprise plan — annual renewal" } },
    },
  },
  monitor: {
    label: "Uptime alert",
    payload: {
      source: "Datadog",
      alert: "API p95 latency above 1200ms",
      severity: "warning",
      message: "api-gateway (us-east-1) p95 at 1430ms for 5 minutes.",
    },
  },
};
