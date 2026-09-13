import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { PhoneFrame, PrimaryButton, ScreenHeader, inputClass } from "@/components/PhoneFrame";
import { TimetableEditor, type DraftRow } from "@/components/TimetableEditor";
import { useProfile, useSaveTimetable, useTimetable, useUpdateProfile } from "@/lib/data";
import { extractTimetable } from "@/lib/timetable.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up — StudyFlow" },
      {
        name: "description",
        content: "Tell us about your studies, add your weekly timetable and set focus preferences.",
      },
      { property: "og:title", content: "Set up — StudyFlow" },
      {
        property: "og:description",
        content: "Tell us about your studies, add your weekly timetable and set focus preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function Onboarding() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: existing = [] } = useTimetable();
  const updateProfile = useUpdateProfile();
  const saveTimetable = useSaveTimetable();

  const [step, setStep] = useState(1);
  const [info, setInfo] = useState({
    name: "",
    student_type: "",
    preferred_study_times: "",
  });
  const [prefs, setPrefs] = useState({
    focus_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    sessions_before_long_break: 4,
  });
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.onboarded) {
      navigate({ to: "/home", replace: true });
      return;
    }
    setInfo({
      name: profile.name ?? "",
      student_type: profile.student_type ?? "",
      preferred_study_times: profile.preferred_study_times ?? "",
    });
    setPrefs({
      focus_minutes: profile.focus_minutes ?? 25,
      short_break_minutes: profile.short_break_minutes ?? 5,
      long_break_minutes: profile.long_break_minutes ?? 15,
      sessions_before_long_break: profile.sessions_before_long_break ?? 4,
    });
  }, [profile, navigate]);

  useEffect(() => {
    if (existing.length && rows.length === 0) {
      setRows(
        existing.map((e) => ({
          day_of_week: e.day_of_week,
          period: e.period,
          subject: e.subject,
          start_time: e.start_time,
          end_time: e.end_time,
        })),
      );
    }
  }, [existing, rows.length]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 8_000_000) {
      toast.error("That image is too large. Please use one under 8 MB.");
      return;
    }
    setReading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await extractTimetable({ data: { dataUrl } });
      if (!result.entries.length) {
        toast.error("Couldn't read that timetable — you can add the periods by hand.");
      } else {
        setRows(result.entries);
        toast.success(`Found ${result.entries.length} periods. Please check them.`);
      }
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setReading(false);
    }
  }

  async function finish() {
    try {
      await saveTimetable.mutateAsync(rows.filter((r) => r.subject.trim()));
      await updateProfile.mutateAsync({ ...info, ...prefs, onboarded: true });
      navigate({ to: "/home", replace: true });
    } catch {
      toast.error("Could not save your setup. Please try again.");
    }
  }

  return (
    <PhoneFrame nav={false}>
      <ScreenHeader title="Quick setup" subtitle={`Step ${step} of 4`} />
      <main className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="Your name"
              maxLength={60}
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Year / class (e.g. Grade 11)"
              maxLength={40}
              value={info.student_type}
              onChange={(e) => setInfo({ ...info, student_type: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Preferred study times (e.g. evenings)"
              maxLength={60}
              value={info.preferred_study_times}
              onChange={(e) =>
                setInfo({ ...info, preferred_study_times: e.target.value })
              }
            />
            <PrimaryButton
              onClick={() => {
                if (!info.name.trim()) {
                  toast.error("Please tell us your name.");
                  return;
                }
                setStep(2);
              }}
            >
              Continue
            </PrimaryButton>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-neutral-600">
              Upload a photo of your weekly timetable and we'll read it for you. You can
              fix anything that looks wrong on the next step.
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center transition-colors hover:bg-[#f6f6f6]">
              <UploadCloud size={28} className="text-neutral-400" />
              <span className="text-[13px] font-semibold text-neutral-700">
                {reading ? "Reading your timetable…" : "Choose a photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={reading}
                onChange={(e) => void handleUpload(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
            >
              Enter it manually instead
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-neutral-600">
              Check your weekly timetable and correct anything that's wrong.
            </p>
            <TimetableEditor rows={rows} onChange={setRows} />
            <PrimaryButton onClick={() => setStep(4)}>Continue</PrimaryButton>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-neutral-600">
              Set your focus session defaults. You can change these any time.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium text-neutral-500">
                Focus minutes
                <input
                  className={`${inputClass} mt-1`}
                  type="number"
                  min={5}
                  max={120}
                  value={prefs.focus_minutes}
                  onChange={(e) =>
                    setPrefs({ ...prefs, focus_minutes: Number(e.target.value) || 25 })
                  }
                />
              </label>
              <label className="text-[11px] font-medium text-neutral-500">
                Short break
                <input
                  className={`${inputClass} mt-1`}
                  type="number"
                  min={1}
                  max={30}
                  value={prefs.short_break_minutes}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      short_break_minutes: Number(e.target.value) || 5,
                    })
                  }
                />
              </label>
              <label className="text-[11px] font-medium text-neutral-500">
                Long break
                <input
                  className={`${inputClass} mt-1`}
                  type="number"
                  min={5}
                  max={60}
                  value={prefs.long_break_minutes}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      long_break_minutes: Number(e.target.value) || 15,
                    })
                  }
                />
              </label>
              <label className="text-[11px] font-medium text-neutral-500">
                Sessions before long break
                <input
                  className={`${inputClass} mt-1`}
                  type="number"
                  min={2}
                  max={8}
                  value={prefs.sessions_before_long_break}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      sessions_before_long_break: Number(e.target.value) || 4,
                    })
                  }
                />
              </label>
            </div>
            <PrimaryButton
              onClick={() => void finish()}
              disabled={saveTimetable.isPending || updateProfile.isPending}
            >
              Finish setup
            </PrimaryButton>
          </div>
        ) : null}
      </main>
    </PhoneFrame>
  );
}
