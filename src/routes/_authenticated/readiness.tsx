import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { PhoneFrame, ScreenHeader } from "@/components/PhoneFrame";
import {
  DAYS,
  fmt12,
  progressForToday,
  readinessScore,
  sortTasks,
  todayISO,
  tomorrowDate,
  usePrepItems,
  useSyncPrepItems,
  useTasks,
  useTimetable,
  useTogglePrep,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/readiness")({
  head: () => ({
    meta: [
      { title: "Readiness — StudyFlow" },
      {
        name: "description",
        content: "See how ready you are for tomorrow and what you still need to pack.",
      },
      { property: "og:title", content: "Readiness — StudyFlow" },
      {
        property: "og:description",
        content: "See how ready you are for tomorrow and what you still need to pack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReadinessScreen,
});

function ReadinessScreen() {
  const tomorrow = tomorrowDate();
  const tomorrowISO = todayISO(tomorrow);
  const { data: tasks = [] } = useTasks();
  const { data: timetable = [] } = useTimetable();
  const { data: prep = [] } = usePrepItems(tomorrowISO);
  const sync = useSyncPrepItems();
  const toggle = useTogglePrep(tomorrowISO);

  const tomorrowPeriods = useMemo(
    () =>
      timetable
        .filter((e) => e.day_of_week === tomorrow.getDay())
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [timetable, tomorrow],
  );

  const subjects = useMemo(
    () => Array.from(new Set(tomorrowPeriods.map((e) => e.subject).filter(Boolean))),
    [tomorrowPeriods],
  );

  const syncMutate = sync.mutate;
  useEffect(() => {
    if (!subjects.length) return;
    const missing = subjects.filter((s) => !prep.some((p) => p.subject === s));
    if (missing.length) syncMutate({ dateISO: tomorrowISO, subjects });
  }, [subjects, prep, tomorrowISO, syncMutate]);

  const progress = progressForToday(tasks);
  const score = readinessScore(tasks, prep);

  return (
    <PhoneFrame>
      <ScreenHeader
        title="Readiness Score"
        subtitle={`Getting ready for ${DAYS[tomorrow.getDay()]}`}
        backTo="/home"
      />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <div className="rounded-xl bg-[#f0f0f0] px-4 py-4">
          <p className="text-[32px] font-bold leading-none text-neutral-900">
            {score.score}%
          </p>
          <div className="mt-3 h-[14px] w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${score.score}%`, backgroundColor: "#10b981" }}
            />
          </div>
          <p className="mt-3 text-[12px] text-neutral-600">
            Today's work {score.workPercent}% (counts for 70%) · Tomorrow's prep{" "}
            {score.prepPercent}% (counts for 30%)
          </p>
        </div>

        <section className="mt-5">
          <h2 className="text-[14px] font-bold text-neutral-900">Today's remaining work</h2>
          {progress.remaining.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-500">All of today's work is done.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {sortTasks(progress.remaining).map((t) => (
                <li key={t.id}>
                  <Link
                    to="/task/$taskId"
                    params={{ taskId: t.id }}
                    className="flex items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3"
                  >
                    <Circle size={18} className="shrink-0 text-neutral-400" />
                    <span className="truncate text-[14px] font-semibold text-neutral-900">
                      {t.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-[14px] font-bold text-neutral-900">Tomorrow's classes</h2>
          {tomorrowPeriods.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-500">No classes tomorrow.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {tomorrowPeriods.map((e) => (
                <li key={e.id} className="text-[12px] text-neutral-600">
                  Period {e.period} · {e.subject} · {fmt12(e.start_time)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5 pb-2">
          <h2 className="text-[14px] font-bold text-neutral-900">Prepare for tomorrow</h2>
          {subjects.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-500">
              Nothing to pack — no classes tomorrow.
            </p>
          ) : (
            subjects.map((subject) => (
              <div key={subject} className="mt-3">
                <p className="text-[13px] font-semibold text-neutral-800">{subject}</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {prep
                    .filter((p) => p.subject === subject)
                    .map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() =>
                            toggle.mutate({ id: p.id, prepared: !p.prepared })
                          }
                          className="flex w-full items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-2.5 text-left transition-colors hover:bg-[#e6e6e6]"
                        >
                          {p.prepared ? (
                            <CheckCircle2 size={18} className="shrink-0 text-[#10b981]" />
                          ) : (
                            <Circle size={18} className="shrink-0 text-neutral-400" />
                          )}
                          <span
                            className={`text-[13px] ${p.prepared ? "text-neutral-400 line-through" : "text-neutral-800"}`}
                          >
                            {p.item}
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </main>
    </PhoneFrame>
  );
}
