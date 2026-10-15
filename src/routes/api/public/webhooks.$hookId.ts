import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DEMO_API_KEY, DEMO_HOOK_ID, normalizePayload } from "@/lib/webhook";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
};

export const Route = createFileRoute("/api/public/webhooks/$hookId")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request, params }) => {
        if (params.hookId !== DEMO_HOOK_ID) {
          return Response.json({ error: "Unknown endpoint" }, { status: 404, headers: cors });
        }
        if (request.headers.get("x-api-key") !== DEMO_API_KEY) {
          return Response.json({ error: "Invalid API key" }, { status: 401, headers: cors });
        }
        const text = await request.text();
        if (text.length > 64_000) {
          return Response.json({ error: "Payload too large" }, { status: 413, headers: cors });
        }
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          return Response.json({ error: "Body must be JSON" }, { status: 400, headers: cors });
        }
        const parsed = z.record(z.unknown()).safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Body must be a JSON object" }, { status: 400, headers: cors });
        }
        const event = normalizePayload(parsed.data);
        return Response.json({ ok: true, channel: "dev-alerts", event }, { headers: cors });
      },
    },
  },
});
