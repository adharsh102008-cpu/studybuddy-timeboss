import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { PhoneFrame, ScreenHeader, useNow } from "@/components/PhoneFrame";
import { DAYS, fmt12, useTimetable } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — StudyFlow" },
      { name: "description", content: "Your classes for today, in order, with period times." },
      { property: "og:title", content: "Timetable — StudyFlow" },
      {
        property: "og:description",
        content: "Your classes for today, in order, with period times.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TimetableScreen,
});

function TimetableScreen() {
  const now = useNow();
  const { data: timetable = [], isLoading } = useTimetable();
  const today = timetable
    .filter((e) => e.day_of_week === now.getDay())
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <PhoneFrame>
      <ScreenHeader
        title={DAYS[now.getDay()] ?? "Today"}
        subtitle="Today's periods"
        action={
          <Link
            to="/calendar"
            className="rounded-xl bg-[#f0f0f0] px-3 py-2 text-[12px] font-semibold text-neutral-700"
          >
            Edit
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {isLoading ? (
          <p className="text-[13px] text-neutral-500">Loading…</p>
        ) : today.length === 0 ? (
          <Link
            to="/calendar"
            className="block rounded-xl bg-[#f0f0f0] px-4 py-6 text-center text-[13px] text-neutral-500"
          >
            No classes today. Tap to set up your weekly timetable.
          </Link>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {today.map((e) => {
              const current = nowHM >= e.start_time && nowHM <= e.end_time;
              return (
                <li key={e.id}>
                  <Link
                    to="/subject/$entryId"
                    params={{ entryId: e.id }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                    style={{ backgroundColor: current ? "#ede9fe" : "#f0f0f0" }}
                  >
                    <div
                      className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                      style={{ backgroundColor: current ? "#8b5cf6" : "#c4c4c4" }}
                    >
                      {e.period}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-neutral-900">
                        {e.subject}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {fmt12(e.start_time)} – {fmt12(e.end_time)}
                        {current ? " · now" : ""}
                      </p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-neutral-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </PhoneFrame>
  );
}
