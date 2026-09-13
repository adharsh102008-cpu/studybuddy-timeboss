import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Timer } from "lucide-react";
import { PhoneFrame, ScreenHeader } from "@/components/PhoneFrame";
import { progressForToday, sortTasks, useTasks, type Task } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Today's progress — StudyFlow" },
      {
        name: "description",
        content: "See exactly what you've finished today and what work is still left.",
      },
      { property: "og:title", content: "Today's progress — StudyFlow" },
      {
        property: "og:description",
        content: "See exactly what you've finished today and what work is still left.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressScreen,
});

function TaskRow({ task, done }: { task: Task; done: boolean }) {
  return (
    <li>
      <Link
        to="/task/$taskId"
        params={{ taskId: task.id }}
        className="flex items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3 transition-colors hover:bg-[#e6e6e6]"
      >
        {done ? (
          <CheckCircle2 size={18} className="shrink-0 text-[#10b981]" />
        ) : (
          <Circle size={18} className="shrink-0 text-neutral-400" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[14px] font-semibold ${done ? "text-neutral-400 line-through" : "text-neutral-900"}`}
          >
            {task.title}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {task.subject || task.kind} · {task.priority} · {task.estimated_minutes} min
          </p>
        </div>
      </Link>
    </li>
  );
}

function ProgressScreen() {
  const { data: tasks = [] } = useTasks();
  const p = progressForToday(tasks);

  return (
    <PhoneFrame>
      <ScreenHeader title="Tasks Completed" subtitle="Your progress today" backTo="/home" />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <div className="rounded-xl bg-[#f0f0f0] px-4 py-4">
          <p className="text-[32px] font-bold leading-none text-neutral-900">
            {p.percent}%
          </p>
          <p className="mt-1 text-[12px] text-neutral-500">
            {p.completed.length} of {p.list.length} tasks done
          </p>
          <div className="mt-3 h-[14px] w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${p.percent}%`, backgroundColor: "#3b82f6" }}
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-neutral-600">
            <Timer size={14} /> About {p.minutesLeft} minutes of work left
          </p>
        </div>

        <section className="mt-5">
          <h2 className="text-[14px] font-bold text-neutral-900">In progress</h2>
          {p.inProgress.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-500">Nothing started right now.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {sortTasks(p.inProgress).map((t) => (
                <TaskRow key={t.id} task={t} done={false} />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-[14px] font-bold text-neutral-900">Still to do</h2>
          {p.remaining.filter((t) => t.status !== "In Progress").length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-500">All caught up.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {sortTasks(p.remaining.filter((t) => t.status !== "In Progress")).map((t) => (
                <TaskRow key={t.id} task={t} done={false} />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5 pb-2">
          <h2 className="text-[14px] font-bold text-neutral-900">Completed</h2>
          {p.completed.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-500">Nothing finished yet today.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {p.completed.map((t) => (
                <TaskRow key={t.id} task={t} done />
              ))}
            </ul>
          )}
        </section>
      </main>
    </PhoneFrame>
  );
}
