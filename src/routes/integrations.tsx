import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Eye, EyeOff, Github, Loader2, Plug, RefreshCw, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { fetchRepoCommits, GITHUB_REPO } from "@/lib/github.functions";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatTime, useStore } from "@/lib/store";
import { DEMO_API_KEY, DEMO_HOOK_ID, SAMPLE_PAYLOADS } from "@/lib/webhook";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations & Webhooks — RicozConnect" },
      { name: "description", content: "Incoming webhook endpoint, API key and a live test event simulator for RicozConnect channels." },
      { property: "og:title", content: "Integrations & Webhooks — RicozConnect" },
      { property: "og:description", content: "Connect tools via incoming webhooks and test events live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(!secret);
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 rounded-md border bg-muted/60 px-3 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{show ? value : "•".repeat(28)}</code>
        {secret && (
          <button onClick={() => setShow(!show)} aria-label={show ? "Hide key" : "Show key"} className="text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 text-xs ring-1 ring-border hover:bg-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function GitHubSync() {
  const { addSystemPost, logDelivery } = useStore();
  const fetchCommits = useServerFn(fetchRepoCommits);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { commits, note } = await fetchCommits({ data: { repo: GITHUB_REPO } });
      if (!commits.length) {
        setMsg(note ?? "No commits found.");
      } else {
        [...commits].reverse().forEach((c) =>
          addSystemPost({ source: "GitHub", title: `${c.author} committed ${c.sha}`, message: c.message, severity: "info", link: c.url }, c),
        );
        logDelivery({ source: "GitHub", status: 200, title: `Synced ${commits.length} commits from ${GITHUB_REPO}` });
        setMsg(`Synced ${commits.length} commits into #dev-alerts.`);
      }
    } catch {
      setMsg("Could not reach GitHub.");
    }
    setBusy(false);
  };
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground"><Github className="h-5 w-5" /></div>
        <div className="min-w-0">
          <h2 className="font-display font-semibold">GitHub repository</h2>
          <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noreferrer" className="truncate text-xs text-primary hover:underline">{GITHUB_REPO}</a>
        </div>
        <button onClick={sync} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync commits
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
    </section>
  );
}

function IntegrationsPage() {
  const { addSystemPost, logDelivery, deliveries } = useStore();
  const [origin, setOrigin] = useState("");
  const [kind, setKind] = useState("github");
  const [json, setJson] = useState(JSON.stringify(SAMPLE_PAYLOADS['github']!.payload, null, 2));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const path = `/api/public/webhooks/${DEMO_HOOK_ID}`;
  const url = `${origin}${path}`;

  const pick = (k: string) => {
    setKind(k);
    setJson(JSON.stringify(SAMPLE_PAYLOADS[k]!.payload, null, 2));
    setResult(null);
  };

  const send = async () => {
    setBusy(true);
    setResult(null);
    let payload: unknown;
    try {
      payload = JSON.parse(json);
    } catch {
      setResult({ ok: false, text: "Payload is not valid JSON." });
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "X-Api-Key": DEMO_API_KEY }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        addSystemPost(data.event, payload);
        logDelivery({ source: data.event.source, status: res.status, title: data.event.title });
        setResult({ ok: true, text: `Delivered → "${data.event.title}" posted to #dev-alerts` });
      } else {
        logDelivery({ source: "Simulator", status: res.status, title: data.error });
        setResult({ ok: false, text: `${res.status}: ${data.error}` });
      }
    } catch {
      setResult({ ok: false, text: "Network error — could not reach the endpoint." });
    }
    setBusy(false);
  };

  return (
    <AppShell title="Integrations" subtitle="Incoming webhooks → channel feeds" icon={<Plug className="h-4 w-4" />}>
      <div className="mx-auto grid max-w-6xl gap-5 p-4 md:p-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground"><Zap className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display font-semibold">Incoming Webhook Endpoint</h2>
                <p className="text-xs text-muted-foreground">Events are posted to <Link to="/c/$channelId" params={{ channelId: "dev-alerts" }} className="text-primary hover:underline">#dev-alerts</Link></p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Active</span>
            </div>
            <div className="mt-5 space-y-3">
              <CopyField label="Endpoint URL (POST)" value={url || path} />
              <CopyField label="API key (send as X-Api-Key header)" value={DEMO_API_KEY} secret />
            </div>
            <div className="mt-4">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Example</div>
              <pre className="overflow-x-auto rounded-md bg-sidebar p-3 font-mono text-[11px] leading-relaxed text-sidebar-foreground">{`curl -X POST ${url || path} \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: <your-api-key>" \\
  -d '{"title":"Deploy finished","message":"v2.4.1 is live","severity":"success"}'`}</pre>
            </div>
          </section>

          <GitHubSync />


          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-display font-semibold">Test Event Simulator</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Sends a real request to the endpoint above and shows the result in #dev-alerts.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(SAMPLE_PAYLOADS).map(([k, v]) => (
                <button key={k} onClick={() => pick(k)} className={`rounded-md border px-3 py-1.5 text-xs font-medium ${kind === k ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted"}`}>{v.label}</button>
              ))}
            </div>
            <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} rows={11} className="mt-3 w-full rounded-md border bg-muted/50 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={send} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Send test event
              </button>
              {result && (
                <span className={`text-sm ${result.ok ? "text-success" : "text-destructive"}`}>
                  {result.text}{" "}
                  {result.ok && <Link to="/c/$channelId" params={{ channelId: "dev-alerts" }} className="font-medium underline">Open feed</Link>}
                </span>
              )}
            </div>
          </section>
        </div>

        <section className="h-fit rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="font-display font-semibold">Delivery log</h2>
          <ul className="mt-3 divide-y">
            {deliveries.map((d) => (
              <li key={d.id} className="flex items-start gap-3 py-2.5">
                <span className={`mt-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${d.status < 300 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{d.status}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground" suppressHydrationWarning>{d.source} · {formatTime(d.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
