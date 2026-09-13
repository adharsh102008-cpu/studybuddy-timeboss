import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Play, Trash2 } from "lucide-react";
import { PhoneFrame, PrimaryButton, ScreenHeader, inputClass } from "@/components/PhoneFrame";
import { TaskForm, draftFromTask, type TaskDraft } from "@/components/TaskForm";
import {
  fmt12,
  useDeleteTask,
  useSessions,
  useTasks,
  useUpdateTask,
  type TaskStatus,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/task/$taskId")({
  head: () => ({
    meta: [
      { title: "Task — StudyFlow" },
      {
        name: "description",
        content: "Task details, focus sessions, reminders and completion status.",
      },
      { property: "og:title", content: "Task — StudyFlow" },
      {
        property: "og:description",
        content: "Task details, focus sessions, reminders and completion status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TaskScreen,
});

const REMINDERS: { label: string; minutes: number }[] = [
  { label: "In 15 min", minutes: 15 },
  { label: "In 30 min", minutes: 30 },
  { label: "In 1 hour", minutes: 60 },
];

function TaskScreen() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: sessions = [] } = useSessions();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [customReminder, setCustomReminder] = useState("");

  const task = tasks.find((t) => t.id === taskId);

  if (isLoading) {
    return (
      <PhoneFrame>
        <ScreenHeader title="Task" backTo="/home" />
        <main className="flex-1 px-5 pt-4 text-[13px] text-neutral-500">Loading…</main>
      </PhoneFrame>
    );
  }

  if (!task) {
    return (
      <PhoneFrame>
        <ScreenHeader title="Task" backTo="/home" />
        <main className="flex-1 px-5 pt-4 text-[13px] text-neutral-500">
          This task no longer exists.
        </main>
      </PhoneFrame>
    );
  }

  const taskSessions = sessions.filter((s) => s.task_id === task.id);
  const focusMinutes = taskSessions.reduce((sum, s) => sum + s.minutes, 0);

  function setStatus(status: TaskStatus) {
    if (!task) return;
    update.mutate({
      id: task.id,
      patch: {
        status,
        completed_at: status === "Completed" ? new Date().toISOString() : null,
      },
    });
  }

  function setReminder(minutes: number) {
    if (!task) return;
    const at = new Date(Date.now() + minutes * 60_000).toISOString();
    update.mutate(
      { id: task.id, patch: { reminder_at: at } },
      { onSuccess: () => toast.success("Reminder set") },
    );
  }

  return (
    <PhoneFrame>
      <ScreenHeader
        title={task.title}
        subtitle={`${task.kind}${task.subject ? ` · ${task.subject}` : ""}`}
        backTo="/home"
      />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {editing && draft ? (
          <div className="flex flex-col gap-3">
            <TaskForm
              draft={draft}
              onChange={setDraft}
              submitLabel="Save changes"
              busy={update.isPending}
              onSubmit={() =>
                update.mutate(
                  {
                    id: task.id,
                    patch: {
                      title: draft.title.trim(),
                      description: draft.description.trim(),
                      kind: draft.kind,
                      subject: draft.subject.trim(),
                      due_date: draft.due_date || null,
                      due_time: draft.due_time || null,
                      priority: draft.priority,
                      estimated_minutes: draft.estimated_minutes,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("Task updated");
                      setEditing(false);
                    },
                    onError: () => toast.error("Could not save your changes."),
                  },
                )
              }
            />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#f0f0f0] px-4 py-3">
              {task.description ? (
                <p className="text-[13px] text-neutral-700">{task.description}</p>
              ) : null}
              <p className="mt-1 text-[12px] text-neutral-500">
                {task.due_date ? `Due ${task.due_date}` : "No due date"}
                {task.due_time ? ` at ${fmt12(task.due_time)}` : ""} · {task.priority}{" "}
                priority · {task.estimated_minutes} min
              </p>
              <p className="mt-1 text-[12px] font-semibold text-neutral-700">
                Status: {task.status}
              </p>
              <p className="mt-1 text-[12px] text-neutral-500">
                {taskSessions.length} focus sessions · {focusMinutes} min focused
              </p>
            </div>

            {task.status !== "Completed" ? (
              <Link
                to="/focus/$taskId"
                params={{ taskId: task.id }}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white"
                style={{ backgroundColor: "#8b5cf6" }}
              >
                <Play size={16} /> Start Focus
              </Link>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("In Progress")}
                className="rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
              >
                Start task
              </button>
              {task.status === "Completed" ? (
                <button
                  type="button"
                  onClick={() => setStatus("Not Started")}
                  className="rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
                >
                  Reopen
                </button>
              ) : (
                <PrimaryButton color="#10b981" onClick={() => setStatus("Completed")}>
                  Mark completed
                </PrimaryButton>
              )}
            </div>

            {task.status !== "Completed" ? (
              <section>
                <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-neutral-900">
                  <Bell size={15} /> Reminder
                </h2>
                {task.reminder_at ? (
                  <p className="mt-1 text-[12px] text-neutral-500">
                    Set for {new Date(task.reminder_at).toLocaleString()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {REMINDERS.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setReminder(r.minutes)}
                      className="rounded-xl bg-[#f0f0f0] px-3 py-2 text-[12px] font-semibold text-neutral-700"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className={inputClass}
                    type="datetime-local"
                    value={customReminder}
                    onChange={(e) => setCustomReminder(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customReminder) return;
                      update.mutate(
                        {
                          id: task.id,
                          patch: {
                            reminder_at: new Date(customReminder).toISOString(),
                          },
                        },
                        { onSuccess: () => toast.success("Reminder set") },
                      );
                    }}
                    className="shrink-0 rounded-xl bg-[#f0f0f0] px-3 text-[12px] font-semibold text-neutral-700"
                  >
                    Set
                  </button>
                </div>
              </section>
            ) : null}

            <div className="flex gap-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(draftFromTask(task));
                  setEditing(true);
                }}
                className="flex-1 rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
              >
                Edit task
              </button>
              <button
                type="button"
                onClick={() =>
                  remove.mutate(task.id, {
                    onSuccess: () => {
                      toast.success("Task deleted");
                      navigate({ to: "/home" });
                    },
                  })
                }
                className="grid w-12 place-items-center rounded-xl bg-[#fee2e2] text-[#ef4444]"
                aria-label="Delete task"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </PhoneFrame>
  );
}
