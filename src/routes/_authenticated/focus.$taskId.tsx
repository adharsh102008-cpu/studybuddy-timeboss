import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, SkipForward, Square } from "lucide-react";
import { PhoneFrame, ScreenHeader } from "@/components/PhoneFrame";
import { useLogSession, useProfile, useSessions, useTasks } from "@/lib/data";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/focus/$taskId")({
  head: () => ({
    meta: [
      { title: "Focus — StudyFlow" },
      { name: "description", content: "Pomodoro focus session for your task." },
      { property: "og:title", content: "Focus — StudyFlow" },
      { property: "og:description", content: "Pomodoro focus session for your task." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FocusScreen,
});

type Mode = "focus" | "short" | "long";

const PRESETS = [25, 45, 60];

function FocusScreen() {
  const { taskId } = Route.useParams();
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = useSessions();
  const { data: profile } = useProfile();
  const logSession = useLogSession();

  const task = tasks.find((t) => t.id === taskId);
  const taskSessions = sessions.filter((s) => s.task_id === taskId);
  const completedFocus = taskSessions.length;

  const focusDefault = profile?.focus_minutes ?? 25;
  const shortDefault = profile?.short_break_minutes ?? 5;
  const longDefault = profile?.long_break_minutes ?? 15;
  const cycleLength = profile?.sessions_before_long_break ?? 4;
  const sound = profile?.notification_sound ?? "chime";

  const [mode, setMode] = useState<Mode>("focus");
  const [durationMin, setDurationMin] = useState(focusDefault);
  const [customMin, setCustomMin] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(focusDefault * 60);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply profile defaults once loaded (before the session starts).
  useEffect(() => {
    if (!profile || started) return;
    setDurationMin(profile.focus_minutes ?? 25);
    setSecondsLeft((profile.focus_minutes ?? 25) * 60);
  }, [profile, started]);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function beginMode(next: Mode, minutes: number) {
    stopTimer();
    setMode(next);
    setSecondsLeft(minutes * 60);
    setRunning(true);
  }

  function completeCurrent() {
    if (mode === "focus") {
      logSession.mutate({ taskId, minutes: durationMin });
      notify("Focus session complete", "Time for a break. Well done!", sound);
      const nextCount = completedFocus + 1;
      if (nextCount % cycleLength === 0) beginMode("long", longDefault);
      else beginMode("short", shortDefault);
    } else {
      notify("Break over", "Time to start your next focus session.", sound);
      beginMode("focus", durationMin);
    }
  }

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stopTimer();
          setTimeout(completeCurrent, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  function pickDuration(min: number) {
    if (running) return;
    setDurationMin(min);
    setCustomMin("");
    if (mode === "focus") setSecondsLeft(min * 60);
  }

  function applyCustom(raw: string) {
    setCustomMin(raw);
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= 180) {
      setDurationMin(n);
      if (!running && mode === "focus") setSecondsLeft(n * 60);
    }
  }

  function stopAll() {
    stopTimer();
    setRunning(false);
    setStarted(false);
    setMode("focus");
    setSecondsLeft(durationMin * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const modeLabel =
    mode === "focus" ? "Focus" : mode === "short" ? "Short Break" : "Long Break";
  const modeColor =
    mode === "focus" ? "#8b5cf6" : mode === "short" ? "#10b981" : "#3b82f6";

  return (
    <PhoneFrame>
      <ScreenHeader
        title="Focus"
        subtitle={task ? task.title : "Pomodoro session"}
        action={
          <Link
            to="/task/$taskId"
            params={{ taskId }}
            aria-label="Back to task"
            className="rounded-full bg-[#f0f0f0] p-2 text-neutral-600"
          >
            <ArrowLeft size={16} />
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {!task ? (
          <p className="text-[13px] text-neutral-500">Task not found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#f0f0f0] px-4 py-3">
              <p className="text-[14px] font-semibold text-neutral-900">{task.title}</p>
              <p className="text-[12px] text-neutral-500">
                {task.subject} · {taskSessions.length} focus sessions completed
              </p>
            </div>

            {!started ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-bold text-neutral-900">
                  Choose focus duration
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => pickDuration(min)}
                      className={`rounded-xl py-3 text-[13px] font-semibold ${
                        durationMin === min && !customMin
                          ? "text-white"
                          : "bg-[#f0f0f0] text-neutral-700"
                      }`}
                      style={
                        durationMin === min && !customMin
                          ? { backgroundColor: "#8b5cf6" }
                          : undefined
                      }
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={180}
                  placeholder="Custom minutes"
                  value={customMin}
                  onChange={(e) => applyCustom(e.target.value)}
                  className="w-full rounded-xl bg-[#f0f0f0] px-3 py-2.5 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStarted(true);
                    beginMode("focus", durationMin);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white"
                  style={{ backgroundColor: "#8b5cf6" }}
                >
                  <Play size={16} /> Start Focus
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: modeColor }}
                >
                  {modeLabel}
                </span>
                <p className="text-[56px] font-bold tabular-nums text-neutral-900">
                  {mm}:{ss}
                </p>
                <p className="text-[12px] text-neutral-500">
                  Session {(completedFocus % cycleLength) + (mode === "focus" ? 1 : 0)} of{" "}
                  {cycleLength} before a long break
                </p>
                <div className="grid w-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRunning(!running)}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white"
                    style={{ backgroundColor: modeColor }}
                  >
                    {running ? <Pause size={16} /> : <Play size={16} />}
                    {running ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={stopAll}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#f0f0f0] py-3 text-[14px] font-semibold text-neutral-700"
                  >
                    <Square size={16} /> Stop
                  </button>
                  {mode !== "focus" ? (
                    <button
                      type="button"
                      onClick={() => beginMode("focus", durationMin)}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-[#f0f0f0] py-3 text-[14px] font-semibold text-neutral-700"
                    >
                      <SkipForward size={16} /> Skip Break
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </PhoneFrame>
  );
}
