import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PhoneFrame, ScreenHeader, PrimaryButton, inputClass } from "@/components/PhoneFrame";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSessions, useUpdateProfile } from "@/lib/data";
import { ensureNotificationPermission } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — StudyFlow" },
      {
        name: "description",
        content: "Your student details, focus preferences and Pomodoro statistics.",
      },
      { property: "og:title", content: "Profile — StudyFlow" },
      {
        property: "og:description",
        content: "Your student details, focus preferences and Pomodoro statistics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfileScreen,
});

const SOUNDS = ["chime", "bell", "beep", "none"];

function ProfileScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useSessions();
  const update = useUpdateProfile();

  const [form, setForm] = useState({
    name: "",
    student_type: "",
    preferred_study_times: "",
    focus_minutes: "25",
    short_break_minutes: "5",
    long_break_minutes: "15",
    sessions_before_long_break: "4",
    notification_sound: "chime",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      student_type: profile.student_type ?? "",
      preferred_study_times: profile.preferred_study_times ?? "",
      focus_minutes: String(profile.focus_minutes ?? 25),
      short_break_minutes: String(profile.short_break_minutes ?? 5),
      long_break_minutes: String(profile.long_break_minutes ?? 15),
      sessions_before_long_break: String(profile.sessions_before_long_break ?? 4),
      notification_sound: profile.notification_sound ?? "chime",
    });
  }, [profile]);

  function parseMinutes(raw: string, min: number, max: number): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return null;
    return n;
  }

  function save() {
    const focus = parseMinutes(form.focus_minutes, 5, 120);
    const shortBreak = parseMinutes(form.short_break_minutes, 1, 30);
    const longBreak = parseMinutes(form.long_break_minutes, 5, 60);
    const sessionsBefore = parseMinutes(form.sessions_before_long_break, 2, 8);
    if (focus === null || shortBreak === null || longBreak === null || sessionsBefore === null) {
      toast.error("Please enter valid numbers for your focus preferences.");
      return;
    }
    update.mutate(
      {
        name: form.name,
        student_type: form.student_type,
        preferred_study_times: form.preferred_study_times,
        notification_sound: form.notification_sound,
        focus_minutes: focus,
        short_break_minutes: shortBreak,
        long_break_minutes: longBreak,
        sessions_before_long_break: sessionsBefore,
      },
      {
        onSuccess: () => toast.success("Saved"),
        onError: () => toast.error("Could not save your settings."),
      },
    );
  }

  const totalMinutes = sessions.reduce((s, x) => s + x.minutes, 0);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <PhoneFrame>
      <ScreenHeader title="Profile" subtitle="Your details and focus settings" />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#f0f0f0] px-4 py-3">
            <p className="text-[20px] font-bold text-neutral-900">{sessions.length}</p>
            <p className="text-[11px] text-neutral-500">Focus sessions</p>
          </div>
          <div className="rounded-xl bg-[#f0f0f0] px-4 py-3">
            <p className="text-[20px] font-bold text-neutral-900">
              {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
            <p className="text-[11px] text-neutral-500">Total focus time</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Name"
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Year / class (e.g. Grade 11)"
            maxLength={40}
            value={form.student_type}
            onChange={(e) => setForm({ ...form, student_type: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Preferred study times (e.g. evenings)"
            maxLength={60}
            value={form.preferred_study_times}
            onChange={(e) => setForm({ ...form, preferred_study_times: e.target.value })}
          />

          <p className="mt-2 text-[13px] font-bold text-neutral-900">Focus preferences</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-medium text-neutral-500">
              Focus minutes
              <input
                className={`${inputClass} mt-1`}
                type="number"
                min={5}
                max={120}
                value={form.focus_minutes}
                onChange={(e) => setForm({ ...form, focus_minutes: e.target.value })}
              />
            </label>
            <label className="text-[11px] font-medium text-neutral-500">
              Short break
              <input
                className={`${inputClass} mt-1`}
                type="number"
                min={1}
                max={30}
                value={form.short_break_minutes}
                onChange={(e) => setForm({ ...form, short_break_minutes: e.target.value })}
              />
            </label>
            <label className="text-[11px] font-medium text-neutral-500">
              Long break
              <input
                className={`${inputClass} mt-1`}
                type="number"
                min={5}
                max={60}
                value={form.long_break_minutes}
                onChange={(e) => setForm({ ...form, long_break_minutes: e.target.value })}
              />
            </label>
            <label className="text-[11px] font-medium text-neutral-500">
              Sessions before long break
              <input
                className={`${inputClass} mt-1`}
                type="number"
                min={2}
                max={8}
                value={form.sessions_before_long_break}
                onChange={(e) =>
                  setForm({ ...form, sessions_before_long_break: e.target.value })
                }
              />
            </label>
            <label className="col-span-2 text-[11px] font-medium text-neutral-500">
              Alert sound
              <select
                className={`${inputClass} mt-1`}
                value={form.notification_sound}
                onChange={(e) => setForm({ ...form, notification_sound: e.target.value })}
              >
                {SOUNDS.map((s) => (
                  <option key={s} value={s}>
                    {s === "none" ? "No sound" : s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await ensureNotificationPermission();
              toast[ok ? "success" : "error"](
                ok ? "Notifications are on." : "Notifications are blocked in your browser.",
              );
            }}
            className="rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
          >
            Enable notifications
          </button>

          <PrimaryButton disabled={update.isPending} onClick={save}>
            Save changes
          </PrimaryButton>

          <button
            type="button"
            onClick={signOut}
            className="mb-2 rounded-xl py-3 text-[13px] font-semibold text-[#ef4444]"
          >
            Sign out
          </button>
        </div>
      </main>
    </PhoneFrame>
  );
}
