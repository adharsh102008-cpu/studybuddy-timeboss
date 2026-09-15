import { PartyPopper } from "lucide-react";

const CONFETTI = [
  { left: "8%", delay: "0s", color: "#3b82f6" },
  { left: "20%", delay: "0.15s", color: "#10b981" },
  { left: "33%", delay: "0.05s", color: "#f59e0b" },
  { left: "47%", delay: "0.25s", color: "#ef4444" },
  { left: "60%", delay: "0.1s", color: "#8b5cf6" },
  { left: "73%", delay: "0.3s", color: "#3b82f6" },
  { left: "86%", delay: "0.2s", color: "#10b981" },
  { left: "94%", delay: "0.35s", color: "#f59e0b" },
];

export function CelebrationModal({
  completionPercent,
  readinessPercent,
  onDone,
  onViewProgress,
}: {
  completionPercent: number;
  readinessPercent: number;
  onDone: () => void;
  onViewProgress: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All tasks completed"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 px-6 backdrop-blur-sm animate-fade-in"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="celebrate-confetti"
            style={{ left: c.left, backgroundColor: c.color, animationDelay: c.delay }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-[300px] rounded-[22px] bg-white p-5 text-center shadow-2xl animate-scale-in">
        <div
          className="mx-auto grid size-14 place-items-center rounded-full text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
        >
          <PartyPopper size={26} strokeWidth={2.25} />
        </div>
        <p className="mt-3 text-[20px] font-bold tracking-tight text-neutral-900">You did it!</p>
        <p className="mt-1 text-[13px] text-neutral-500">All tasks for today are complete.</p>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Great work. Tomorrow is ready when you are.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#f0f0f0] px-3 py-2.5">
            <p className="text-[18px] font-bold text-neutral-900">{completionPercent}%</p>
            <p className="text-[11px] text-neutral-500">Tasks completed</p>
          </div>
          <div className="rounded-xl bg-[#f0f0f0] px-3 py-2.5">
            <p className="text-[18px] font-bold text-neutral-900">{readinessPercent}%</p>
            <p className="text-[11px] text-neutral-500">Readiness</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onViewProgress}
            className="w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#3b82f6" }}
          >
            View Progress
          </button>
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-xl bg-[#f0f0f0] py-3 text-[14px] font-semibold text-neutral-700 transition-colors hover:bg-[#e6e6e6]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
