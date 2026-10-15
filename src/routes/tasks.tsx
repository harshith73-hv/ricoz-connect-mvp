import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, KanbanSquare, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AppShell, Avatar } from "@/components/AppShell";
import { USERS, useStore, type Priority, type Status, type Task } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Board — RicozConnect" },
      { name: "description", content: "Kanban board to plan, assign and track team work across To Do, In Progress and Completed." },
      { property: "og:title", content: "Task Board — RicozConnect" },
      { property: "og:description", content: "Plan, assign and track team work on a Kanban board." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasksPage,
});

const COLS: { id: Status; label: string; dot: string }[] = [
  { id: "todo", label: "To Do", dot: "bg-muted-foreground" },
  { id: "in_progress", label: "In Progress", dot: "bg-info" },
  { id: "completed", label: "Completed", dot: "bg-success" },
];
const PRI: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-warning/20 text-warning-foreground",
  High: "bg-destructive/15 text-destructive",
};

function TasksPage() {
  const { tasks, moveTask, deleteTask, search } = useStore();
  const [adding, setAdding] = useState<Status | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const q = search.toLowerCase();
  const visible = tasks.filter((t) => !q || (t.title + t.assignee).toLowerCase().includes(q));

  return (
    <AppShell title="Tasks" subtitle="Team Kanban board" icon={<KanbanSquare className="h-4 w-4" />}>
      <div className="flex items-center justify-between px-4 pt-4 md:px-6">
        <p className="text-sm text-muted-foreground">{tasks.length} tasks · drag cards or use the arrows to move them</p>
        <button onClick={() => setAdding("todo")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> New task
        </button>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
        {COLS.map((col, ci) => {
          const items = visible.filter((t) => t.status === col.id);
          return (
            <section
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && moveTask(dragId, col.id)}
              className="flex min-h-64 flex-col rounded-lg bg-muted/70 p-3"
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <h2 className="font-display text-sm font-semibold">{col.label}</h2>
                <span className="rounded-full bg-card px-2 text-xs text-muted-foreground">{items.length}</span>
                <button onClick={() => setAdding(col.id)} className="ml-auto rounded p-1 text-muted-foreground hover:bg-card" aria-label={`Add to ${col.label}`}>
                  <Plus className="h-4 w-4" />
                </button>
              </header>
              <div className="flex flex-1 flex-col gap-2">
                {items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onDrag={() => setDragId(t.id)}
                    onPrev={ci > 0 ? () => moveTask(t.id, COLS[ci - 1]!.id) : undefined}
                    onNext={ci < 2 ? () => moveTask(t.id, COLS[ci + 1]!.id) : undefined}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
                {items.length === 0 && <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">Drop tasks here</div>}
              </div>
            </section>
          );
        })}
      </div>
      {adding && <NewTaskDialog status={adding} onClose={() => setAdding(null)} />}
    </AppShell>
  );
}

function TaskCard({ task, onDrag, onPrev, onNext, onDelete }: { task: Task; onDrag: () => void; onPrev?: (() => void) | undefined; onNext?: (() => void) | undefined; onDelete: () => void }) {
  const u = USERS.find((x) => x.name === task.assignee);
  const initials = u?.initials ?? task.assignee.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <article draggable onDragStart={onDrag} className="group cursor-grab rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing">
      <div className="flex items-start gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRI[task.priority]}`}>{task.priority}</span>
        <button onClick={onDelete} className="ml-auto text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100" aria-label="Delete task">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <h3 className={`mt-2 text-sm font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{task.title}</h3>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Avatar initials={initials} size="sm" />
        <span className="truncate">{task.assignee}</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" /> {task.due}
        </span>
      </div>
      <div className="mt-2 flex justify-between border-t pt-2">
        <button disabled={!onPrev} onClick={onPrev} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:invisible" aria-label="Move back">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button disabled={!onNext} onClick={onNext} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:invisible" aria-label="Move forward">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function NewTaskDialog({ status, onClose }: { status: Status; onClose: () => void }) {
  const { addTask } = useStore();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(USERS[0]!.name);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [due, setDue] = useState("2026-10-10");
  const [col, setCol] = useState<Status>(status);
  const field = "mt-1 h-9 w-full rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addTask({ title: title.trim(), assignee, priority, due, status: col });
          onClose();
        }}
        className="w-full max-w-md space-y-3 rounded-lg bg-card p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">New task</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <label className="block text-sm">Title<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="What needs doing?" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Assignee
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={field}>{USERS.map((u) => <option key={u.id}>{u.name}</option>)}</select>
          </label>
          <label className="block text-sm">Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={field}><option>Low</option><option>Medium</option><option>High</option></select>
          </label>
          <label className="block text-sm">Due date<input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} /></label>
          <label className="block text-sm">Column
            <select value={col} onChange={(e) => setCol(e.target.value as Status)} className={field}>{COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
          <button type="submit" disabled={!title.trim()} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">Create task</button>
        </div>
      </form>
    </div>
  );
}
