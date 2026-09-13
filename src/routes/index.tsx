import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  CalendarDays,
  ListChecks,
  Hourglass,
  Plus,
  ChevronRight,
  Wifi,
  BatteryFull,
  Signal,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "StudyTimer — Student Time Management",
      },
      {
        name: "description",
        content:
          "Track your day, subjects, and progress at a glance — a simple time management companion for students.",
      },
      { property: "og:title", content: "StudyTimer — Student Time Management" },
      {
        property: "og:description",
        content:
          "Track your day, subjects, and progress at a glance — a simple time management companion for students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function greetingFor(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatClock(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatStatusBarTime(d: Date) {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const SUBJECTS = [
  { name: "Mathematics", start: "10:00 AM", end: "11:00 AM" },
  { name: "Physics", start: "11:30 AM", end: "12:30 PM" },
  { name: "English", start: "1:00 PM", end: "2:00 PM" },
  { name: "Chemistry", start: "2:30 PM", end: "3:30 PM" },
];

function ProgressBar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
}) {
  return (
    <div>
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
    </div>
  );
}

function PhoneMockup() {
  const now = useNow();
  const greeting = greetingFor(now.getHours());
  const dateText = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative flex h-[667px] w-[380px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-3 text-[13px] font-semibold text-neutral-900">
        <span>{formatStatusBarTime(now)}</span>
        <div className="flex items-center gap-1.5 text-neutral-900">
          <Signal size={15} strokeWidth={2.25} />
          <Wifi size={15} strokeWidth={2.25} />
          <BatteryFull size={20} strokeWidth={2} />
        </div>
      </div>

      {/* Header */}
      <header className="flex items-start justify-between px-5 pt-3">
        <div>
          <p className="text-[15px] font-semibold text-neutral-900">{dateText}</p>
          <p className="mt-0.5 text-[22px] font-bold tracking-tight text-neutral-900">
            {greeting}, Aarav!
          </p>
        </div>
        <div
          className="grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
        >
          A
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-5 pt-5">
        {/* Progress bars */}
        <section className="flex flex-col gap-4">
          <ProgressBar
            label="Tasks Completed"
            value="6/10"
            percent={60}
            color="#3b82f6"
          />
          <ProgressBar label="Read Score" value="72%" percent={72} color="#10b981" />
        </section>

        {/* Today's subjects */}
        <section className="mt-6">
          <h2 className="text-[16px] font-bold text-neutral-900">Today's Subjects</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {SUBJECTS.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3 text-left transition-colors duration-200 hover:bg-[#e6e6e6] active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-neutral-900">{s.name}</p>
                    <p className="mt-0.5 text-[12px] text-neutral-500">
                      {s.start} – {s.end}
                    </p>
                  </div>
                  <ChevronRight size={18} strokeWidth={2.25} className="shrink-0 text-neutral-400" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Bottom navigation */}
      <nav className="mt-auto flex items-stretch justify-between gap-1 border-t border-neutral-100 bg-white px-3 pb-3 pt-2">
        {[
          { label: "Home", icon: Home, color: "#3b82f6" },
          { label: "Calendar", icon: CalendarDays, color: "#10b981" },
          { label: "Timetable", icon: ListChecks, color: "#8b5cf6" },
          { label: "Timer", icon: Hourglass, color: "#ef4444" },
          { label: "Add", icon: Plus, color: "#f59e0b" },
        ].map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            type="button"
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
            style={{ color }}
          >
            <Icon size={22} strokeWidth={2.25} />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Index() {
  const now = useNow();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-100 px-4 py-10 font-sans">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
        Home · {formatClock(now)}
      </p>
      <PhoneMockup />
    </div>
  );
}
