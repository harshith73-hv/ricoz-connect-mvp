import { AlertTriangle, CheckCircle2, ChevronDown, CreditCard, ExternalLink, GitBranch, Info, Send, Siren, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./AppShell";
import { USERS, formatTime, useStore, type Post } from "@/lib/store";

const TAGS = ["Message", "Update", "Announcement"];

export function Feed({ channelId }: { channelId: string }) {
  const { posts, addPost, search } = useStore();
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Message");
  const endRef = useRef<HTMLDivElement>(null);
  const q = search.toLowerCase();
  const list = posts
    .filter((p) => p.channelId === channelId)
    .filter((p) => !q || (p.body + (p.kind === "system" ? p.title + p.source : "")).toLowerCase().includes(q))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [list.length]);

  const submit = () => {
    if (!body.trim()) return;
    addPost(channelId, body.trim(), tag === "Message" ? undefined : tag);
    setBody("");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div className="space-y-3">
        {list.length === 0 && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No posts yet. Start the conversation below.</div>}
        {list.map((p) => (p.kind === "user" ? <UserPost key={p.id} post={p} /> : <SystemPost key={p.id} post={p} />))}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-4 rounded-lg border bg-card p-3 shadow-sm">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder={`Share an update in #${channelId}…`}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1">
            {TAGS.map((t) => (
              <button key={t} onClick={() => setTag(t)} className={`rounded-full px-2.5 py-1 text-xs ${tag === t ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={submit} disabled={!body.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> Post
          </button>
        </div>
      </div>
    </div>
  );
}

function UserPost({ post }: { post: Extract<Post, { kind: "user" }> }) {
  const u = USERS.find((x) => x.id === post.authorId) ?? USERS[0]!;
  return (
    <article className="flex gap-3 rounded-lg border bg-card p-4">
      <Avatar initials={u.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{u.name}</span>
          <span className="text-xs text-muted-foreground">{u.role}</span>
          {post.tag && <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${post.tag === "Announcement" ? "bg-warning/20 text-warning-foreground" : "bg-accent text-accent-foreground"}`}>{post.tag}</span>}
          <time className="ml-auto text-xs text-muted-foreground" suppressHydrationWarning>{formatTime(post.createdAt)}</time>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
      </div>
    </article>
  );
}

const SEV = {
  info: { icon: Info, cls: "text-info" },
  success: { icon: CheckCircle2, cls: "text-success" },
  warning: { icon: AlertTriangle, cls: "text-warning" },
  critical: { icon: Siren, cls: "text-destructive" },
};
const SRC_ICON: Record<string, typeof Zap> = { GitHub: GitBranch, Stripe: CreditCard };

function SystemPost({ post }: { post: Extract<Post, { kind: "system" }> }) {
  const [open, setOpen] = useState(false);
  const s = SEV[post.severity];
  const SrcIcon = SRC_ICON[post.source] ?? Zap;
  return (
    <article className="rounded-lg border border-system-border bg-system p-4 font-sans">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-card text-foreground ring-1 ring-system-border">
          <SrcIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-card px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ring-1 ring-system-border">Integration · {post.source}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${s.cls}`}>
              <s.icon className="h-3.5 w-3.5" /> {post.severity}
            </span>
            <time className="ml-auto text-xs text-muted-foreground" suppressHydrationWarning>{formatTime(post.createdAt)}</time>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold">{post.title}</h3>
          <p className="mt-1 whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{post.body}</p>
          <div className="mt-2 flex gap-3 text-xs">
            {post.link && (
              <a href={post.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                View source <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {post.payload != null && (
              <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                Payload <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
          {open && <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-sidebar p-3 font-mono text-[11px] text-sidebar-foreground">{JSON.stringify(post.payload, null, 2)}</pre>}
        </div>
      </div>
    </article>
  );
}
