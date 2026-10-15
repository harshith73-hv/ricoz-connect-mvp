import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NormalizedEvent, Severity } from "./webhook";

export type Channel = { id: string; name: string; description: string };
export type User = { id: string; name: string; role: string; initials: string };
export type Post =
  | { id: string; channelId: string; kind: "user"; authorId: string; body: string; tag?: string | undefined; createdAt: string }
  | {
      id: string;
      channelId: string;
      kind: "system";
      source: string;
      title: string;
      body: string;
      severity: Severity;
      link?: string | undefined;
      payload?: unknown | undefined;
      createdAt: string;
    };
export type Status = "todo" | "in_progress" | "completed";
export type Priority = "Low" | "Medium" | "High";
export type Task = { id: string; title: string; assignee: string; priority: Priority; due: string; status: Status };
export type Delivery = { id: string; at: string; source: string; status: number; title: string };

type State = { channels: Channel[]; posts: Post[]; tasks: Task[]; deliveries: Delivery[] };

export const USERS: User[] = [
  { id: "u1", name: "Harshith S.", role: "Product Lead", initials: "HS" },
  { id: "u2", name: "Priya Nair", role: "Engineering Manager", initials: "PN" },
  { id: "u3", name: "Marcus Lee", role: "Designer", initials: "ML" },
  { id: "u4", name: "Aisha Khan", role: "DevOps", initials: "AK" },
];
export const CURRENT_USER: User = USERS[0]!;

const h = (n: number) => new Date(Date.UTC(2026, 9, 3, n, 0)).toISOString();

const SEED: State = {
  channels: [
    { id: "general", name: "general", description: "Company-wide announcements and chatter" },
    { id: "product", name: "product", description: "Roadmap, specs and launch planning" },
    { id: "dev-alerts", name: "dev-alerts", description: "Automated events from connected tools" },
  ],
  posts: [
    { id: "p1", channelId: "general", kind: "user", authorId: "u2", tag: "Announcement", body: "Q4 kickoff is Monday at 10:00. Agenda and pre-reads are in the shared drive — please skim before the call.", createdAt: h(8) },
    { id: "p2", channelId: "general", kind: "user", authorId: "u3", body: "New brand guidelines are live 🎨 Shout if anything looks off in your product area.", createdAt: h(10) },
    { id: "p3", channelId: "general", kind: "user", authorId: "u4", tag: "Update", body: "Planned maintenance window tonight 23:00–23:30 UTC. No customer impact expected.", createdAt: h(13) },
    { id: "p4", channelId: "product", kind: "user", authorId: "u1", tag: "Update", body: "Spec for the Approvals workflow is ready for review. Targeting beta in two sprints.", createdAt: h(9) },
    { id: "p5", channelId: "product", kind: "user", authorId: "u3", body: "Uploaded three onboarding flow variants — leaning toward option B.", createdAt: h(12) },
    { id: "p6", channelId: "dev-alerts", kind: "system", source: "GitHub", severity: "info", title: "priya.n pushed 3 commits to main", body: "• feat: kanban column limits\n• fix: feed pagination\n• chore: bump deps", createdAt: h(11) },
    { id: "p7", channelId: "dev-alerts", kind: "system", source: "Datadog", severity: "warning", title: "Disk usage above 85% on db-replica-2", body: "Volume /data at 87%. Auto-cleanup scheduled.", createdAt: h(12) },
    { id: "p8", channelId: "dev-alerts", kind: "system", source: "Stripe", severity: "success", title: "Payment received: USD 1,299.00", body: "billing@northwind.io — Team plan, annual", createdAt: h(14) },
  ],
  tasks: [
    { id: "t1", title: "Finalize Q4 OKRs", assignee: "Harshith S.", priority: "High", due: "2026-10-07", status: "todo" },
    { id: "t2", title: "Audit webhook retry policy", assignee: "Aisha Khan", priority: "Medium", due: "2026-10-10", status: "todo" },
    { id: "t3", title: "Design approvals empty state", assignee: "Marcus Lee", priority: "Low", due: "2026-10-14", status: "todo" },
    { id: "t4", title: "Kanban drag-and-drop", assignee: "Priya Nair", priority: "High", due: "2026-10-06", status: "in_progress" },
    { id: "t5", title: "Migrate alerts to new on-call rota", assignee: "Aisha Khan", priority: "Medium", due: "2026-10-08", status: "in_progress" },
    { id: "t6", title: "Publish brand guidelines", assignee: "Marcus Lee", priority: "Medium", due: "2026-10-02", status: "completed" },
    { id: "t7", title: "Set up #dev-alerts webhook", assignee: "Priya Nair", priority: "High", due: "2026-10-01", status: "completed" },
  ],
  deliveries: [
    { id: "d1", at: h(14), source: "Stripe", status: 200, title: "Payment received: USD 1,299.00" },
    { id: "d2", at: h(12), source: "Datadog", status: 200, title: "Disk usage above 85% on db-replica-2" },
    { id: "d3", at: h(11), source: "GitHub", status: 200, title: "priya.n pushed 3 commits to main" },
  ],
};

const KEY = "ricozconnect:v1";
const uid = () => Math.random().toString(36).slice(2, 10);

type Ctx = State & {
  search: string;
  setSearch: (s: string) => void;
  addPost: (channelId: string, body: string, tag?: string) => void;
  addSystemPost: (e: NormalizedEvent, payload: unknown) => void;
  logDelivery: (d: Omit<Delivery, "id" | "at">) => void;
  addTask: (t: Omit<Task, "id">) => void;
  moveTask: (id: string, status: Status) => void;
  deleteTask: (id: string) => void;
  addChannel: (name: string) => string;
  reset: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(SEED);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const addPost = useCallback((channelId: string, body: string, tag?: string) => {
    setState((s) => ({ ...s, posts: [...s.posts, { id: uid(), channelId, kind: "user", authorId: CURRENT_USER.id, body, tag, createdAt: new Date().toISOString() }] }));
  }, []);
  const addSystemPost = useCallback((e: NormalizedEvent, payload: unknown) => {
    setState((s) => ({
      ...s,
      posts: [...s.posts, { id: uid(), channelId: "dev-alerts", kind: "system", source: e.source, title: e.title, body: e.message, severity: e.severity, link: e.link, payload, createdAt: new Date().toISOString() }],
    }));
  }, []);
  const logDelivery = useCallback((d: Omit<Delivery, "id" | "at">) => {
    setState((s) => ({ ...s, deliveries: [{ ...d, id: uid(), at: new Date().toISOString() }, ...s.deliveries].slice(0, 20) }));
  }, []);
  const addTask = useCallback((t: Omit<Task, "id">) => setState((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: uid() }] })), []);
  const moveTask = useCallback((id: string, status: Status) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })), []);
  const deleteTask = useCallback((id: string) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })), []);
  const addChannel = useCallback((name: string) => {
    const id = name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    setState((s) => (s.channels.some((c) => c.id === id) ? s : { ...s, channels: [...s.channels, { id, name: id, description: "New channel" }] }));
    return id;
  }, []);
  const reset = useCallback(() => setState(SEED), []);

  const value = useMemo(
    () => ({ ...state, search, setSearch, addPost, addSystemPost, logDelivery, addTask, moveTask, deleteTask, addChannel, reset }),
    [state, search, addPost, addSystemPost, logDelivery, addTask, moveTask, deleteTask, addChannel, reset],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
