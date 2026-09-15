import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ListTodo } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneFrame, useNow } from "@/components/PhoneFrame";
import { CelebrationModal } from "@/components/CelebrationModal";
import {
  fmt12,
  progressForToday,
  readinessScore,
  sortTasks,
  todayISO,
  tomorrowDate,
  usePrepItems,
  useProfile,
  useTasks,
  useTimetable,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Today — StudyFlow" },
      {
        name: "description",
        content: "Your daily dashboard: today's subjects, task progress and readiness score.",
      },
      { property: "og:title", content: "Today — StudyFlow" },
      {
        property: "og:description",
        content: "Your daily dashboard: today's subjects, task progress and readiness score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeScreen,
});

function greetingFor(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function ProgressBar({
  label,
  value,
  percent,
  color,
  onClick,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-neutral-800">{label}</span>
        <span className="text-[13px] font-semibold text-neutral-900">{value}</span>
      </div>
      <div className="mt-1.5 h-[14px] w-full overflow-hidden rounded-full bg-[#f0f0f0]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </button>
  );
}

function HomeScreen() {
  const now = useNow();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useTasks();
  const { data: timetable = [] } = useTimetable();
  const tomorrowISO = todayISO(tomorrowDate());
  const { data: prep = [] } = usePrepItems(tomorrowISO);

  const progress = progressForToday(tasks);
  const readiness = readinessScore(tasks, prep);

  const todaysPeriods = timetable
    .filter((e) => e.day_of_week === now.getDay())
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const [celebrate, setCelebrate] = useState(false);
  const allDone = progress.list.length > 0 && progress.remaining.length === 0;

  useEffect(() => {
    if (!allDone) return;
    const key = "studyflow-celebrated";
    try {
      if (window.localStorage.getItem(key) === todayISO()) return;
      window.localStorage.setItem(key, todayISO());
    } catch {
      /* ignore */
    }
    setCelebrate(true);
  }, [allDone]);

  const dateText = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const firstName = (profile?.name || "there").split(" ")[0];

  return (
    <PhoneFrame>
      <header className="flex items-start justify-between px-5 pt-3">
        <div>
          <p className="text-[15px] font-semibold text-neutral-900">{dateText}</p>
          <p className="mt-0.5 text-[22px] font-bold tracking-tight text-neutral-900">
            {greetingFor(now.getHours())}, {firstName}!
          </p>
        </div>
        <Link
          to="/profile"
          className="grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
        >
          {(profile?.name || "S").charAt(0).toUpperCase()}
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-5">
        <section className="flex flex-col gap-4">
          <ProgressBar
            label="Tasks Completed"
            value={`${progress.completed.length}/${progress.list.length}`}
            percent={progress.percent}
            color="#3b82f6"
            onClick={() => navigate({ to: "/progress" })}
          />
          <ProgressBar
            label="Readiness Score"
            value={`${readiness.score}%`}
            percent={readiness.score}
            color="#10b981"
            onClick={() => navigate({ to: "/readiness" })}
          />
        </section>

        <section className="mt-6">
          <h2 className="text-[16px] font-bold text-neutral-900">Today's Subjects</h2>
          {todaysPeriods.length === 0 ? (
            <Link
              to="/calendar"
              className="mt-3 block rounded-xl bg-[#f0f0f0] px-4 py-5 text-center text-[13px] text-neutral-500"
            >
              No classes set for today — set up your weekly timetable
            </Link>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {todaysPeriods.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/subject/$entryId"
                    params={{ entryId: s.id }}
                    className="flex w-full items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3 text-left transition-colors duration-200 hover:bg-[#e6e6e6] active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-neutral-900">
                        {s.subject}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        Period {s.period} · {fmt12(s.start_time)} – {fmt12(s.end_time)}
                      </p>
                    </div>
                    <ChevronRight size={18} strokeWidth={2.25} className="shrink-0 text-neutral-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-neutral-900">Remaining Work</h2>
            <Link to="/progress" className="text-[12px] font-semibold text-[#3b82f6]">
              View all
            </Link>
          </div>
          {progress.remaining.length === 0 ? (
            <div className="mt-3 rounded-xl bg-[#f0f0f0] px-4 py-5 text-center text-[13px] text-neutral-500">
              Nothing left for today. Time to prepare for tomorrow.
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {sortTasks(progress.remaining)
                .slice(0, 4)
                .map((t) => (
                  <li key={t.id}>
                    <Link
                      to="/task/$taskId"
                      params={{ taskId: t.id }}
                      className="flex w-full items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3 transition-colors hover:bg-[#e6e6e6]"
                    >
                      <ListTodo size={18} className="shrink-0 text-neutral-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-neutral-900">
                          {t.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          {t.subject || t.kind} · {t.priority} · {t.estimated_minutes} min
                        </p>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-neutral-400" />
                    </Link>
                  </li>
                ))}
            </ul>
          )}

          {progress.remaining.length === 0 && progress.list.length > 0 ? (
            <Link
              to="/readiness"
              className="mt-3 flex items-center justify-between rounded-xl px-4 py-3 text-white"
              style={{ backgroundColor: "#10b981" }}
            >
              <span className="text-[14px] font-semibold">Prepare for Tomorrow</span>
              <ChevronRight size={18} />
            </Link>
          ) : null}
        </section>
      </main>

      {celebrate ? (
        <CelebrationModal
          completionPercent={progress.percent}
          readinessPercent={readiness.score}
          onDone={() => setCelebrate(false)}
          onViewProgress={() => {
            setCelebrate(false);
            navigate({ to: "/progress" });
          }}
        />
      ) : null}
    </PhoneFrame>
  );
}
