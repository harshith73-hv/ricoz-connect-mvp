import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Hash, KanbanSquare, LayoutList, Menu, Plug, Plus, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CURRENT_USER, useStore } from "@/lib/store";

export function AppShell({ title, subtitle, icon, children }: { title: string; subtitle?: string | undefined; icon?: ReactNode; children: ReactNode }) {
  const { channels, search, setSearch, addChannel } = useStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const navCls = "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const active = { className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" };

  const newChannel = () => {
    const name = window.prompt("New channel name");
    if (name?.trim()) {
      const id = addChannel(name);
      navigate({ to: "/c/$channelId", params: { channelId: id } });
    }
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">RC</div>
        <div>
          <div className="font-display text-base font-semibold text-sidebar-accent-foreground">RicozConnect</div>
          <div className="text-xs opacity-70">Ricoz Workspace</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        <div className="space-y-0.5">
          <Link to="/" className={navCls} activeProps={active} activeOptions={{ exact: true }} onClick={() => setOpen(false)}>
            <LayoutList className="h-4 w-4" /> Feed
          </Link>
          <Link to="/tasks" className={navCls} activeProps={active} onClick={() => setOpen(false)}>
            <KanbanSquare className="h-4 w-4" /> Tasks
          </Link>
          <Link to="/integrations" className={navCls} activeProps={active} onClick={() => setOpen(false)}>
            <Plug className="h-4 w-4" /> Integrations
          </Link>
        </div>
        <div>
          <div className="flex items-center justify-between px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-60">
            Channels
            <button onClick={newChannel} aria-label="Create channel" className="rounded p-0.5 hover:bg-sidebar-accent">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {channels.map((c) => (
              <Link key={c.id} to="/c/$channelId" params={{ channelId: c.id }} className={navCls} activeProps={active} onClick={() => setOpen(false)}>
                <Hash className="h-4 w-4 opacity-70" /> {c.name}
                {c.id === "dev-alerts" && <span className="ml-auto h-2 w-2 rounded-full bg-sidebar-primary" />}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
        <Avatar initials={CURRENT_USER.initials} />
        <div className="text-sm">
          <div className="font-medium text-sidebar-accent-foreground">{CURRENT_USER.name}</div>
          <div className="text-xs opacity-70">{CURRENT_USER.role}</div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <div className="hidden md:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {sidebar}
          <button className="flex-1 bg-foreground/40" aria-label="Close menu" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-base font-semibold leading-tight">{title}</h1>
              {subtitle && <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts & tasks"
                className="h-9 w-56 rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring lg:w-72"
              />
            </div>
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Avatar initials={CURRENT_USER.initials} />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground ${size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"}`}>
      {initials}
    </div>
  );
}
