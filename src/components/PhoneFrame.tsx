import { Link, useRouterState } from "@tanstack/react-router";
import {
  BatteryFull,
  CalendarDays,
  Home,
  ListChecks,
  Plus,
  Signal,
  User,
  Wifi,
  ChevronLeft,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatStatusBarTime(d: Date) {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const NAV = [
  { label: "Home", to: "/home", icon: Home, color: "#3b82f6" },
  { label: "Calendar", to: "/calendar", icon: CalendarDays, color: "#10b981" },
  { label: "Timetable", to: "/timetable", icon: ListChecks, color: "#8b5cf6" },
  { label: "Add", to: "/add", icon: Plus, color: "#f59e0b" },
  { label: "Profile", to: "/profile", icon: User, color: "#ef4444" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mt-auto flex items-stretch justify-between gap-1 border-t border-neutral-100 bg-white px-3 pb-3 pt-2">
      {NAV.map(({ label, to, icon: Icon, color }) => {
        const active = pathname === to;
        return (
          <Link
            key={label}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
            style={{ color, opacity: active ? 1 : 0.65 }}
          >
            <Icon size={22} strokeWidth={2.25} />
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function StatusBar() {
  const now = useNow();
  return (
    <div className="flex items-center justify-between px-6 pt-3 text-[13px] font-semibold text-neutral-900">
      <span>{formatStatusBarTime(now)}</span>
      <div className="flex items-center gap-1.5 text-neutral-900">
        <Signal size={15} strokeWidth={2.25} />
        <Wifi size={15} strokeWidth={2.25} />
        <BatteryFull size={20} strokeWidth={2} />
      </div>
    </div>
  );
}

export function PhoneFrame({
  children,
  nav = true,
}: {
  children: ReactNode;
  nav?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-6 font-sans">
      <div className="relative flex h-[667px] max-h-[calc(100vh-3rem)] w-full max-w-[380px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
        <StatusBar />
        {children}
        {nav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  backTo,
  action,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-3">
      <div className="flex min-w-0 items-center gap-2">
        {backTo ? (
          <Link
            to={backTo}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f0f0f0] text-neutral-700 transition-colors hover:bg-[#e6e6e6]"
            aria-label="Go back"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </Link>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold tracking-tight text-neutral-900">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-[#f0f0f0] px-4 py-3 ${className}`}>{children}</div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  color = "#3b82f6",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: color }}
      className={`w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl bg-[#f0f0f0] px-3 py-2.5 text-[14px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:bg-[#e9e9e9]";
