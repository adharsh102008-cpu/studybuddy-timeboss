import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { PhoneFrame, PrimaryButton, ScreenHeader } from "@/components/PhoneFrame";
import { TimetableEditor, type DraftRow } from "@/components/TimetableEditor";
import { DAYS, fmt12, useSaveTimetable, useTimetable } from "@/lib/data";
import { extractTimetable } from "@/lib/timetable.functions";
import { fileToDataUrl } from "@/routes/_authenticated/onboarding";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Weekly timetable — StudyFlow" },
      {
        name: "description",
        content: "See and edit your weekly class timetable, or upload a photo of it.",
      },
      { property: "og:title", content: "Weekly timetable — StudyFlow" },
      {
        property: "og:description",
        content: "See and edit your weekly class timetable, or upload a photo of it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarScreen,
});

function CalendarScreen() {
  const { data: timetable = [] } = useTimetable();
  const save = useSaveTimetable();
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    setRows(
      timetable.map((e) => ({
        day_of_week: e.day_of_week,
        period: e.period,
        subject: e.subject,
        start_time: e.start_time,
        end_time: e.end_time,
      })),
    );
  }, [timetable]);

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
      setEditing(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setReading(false);
    }
  }

  return (
    <PhoneFrame>
      <ScreenHeader
        title="Weekly timetable"
        subtitle={editing ? "Edit your periods" : "Your classes each week"}
        action={
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-xl bg-[#f0f0f0] px-3 py-2 text-[12px] font-semibold text-neutral-700"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {editing ? (
          <div className="flex flex-col gap-4">
            <TimetableEditor rows={rows} onChange={setRows} />
            <PrimaryButton
              disabled={save.isPending}
              onClick={() =>
                save.mutate(rows.filter((r) => r.subject.trim()), {
                  onSuccess: () => {
                    toast.success("Timetable saved");
                    setEditing(false);
                  },
                  onError: () => toast.error("Could not save your timetable."),
                })
              }
            >
              Save timetable
            </PrimaryButton>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3 transition-colors hover:bg-[#e6e6e6]">
              <UploadCloud size={20} className="text-neutral-500" />
              <span className="text-[13px] font-semibold text-neutral-700">
                {reading ? "Reading your timetable…" : "Upload timetable photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={reading}
                onChange={(e) => void handleUpload(e.target.files?.[0])}
              />
            </label>

            {timetable.length === 0 ? (
              <p className="rounded-xl bg-[#f0f0f0] px-4 py-6 text-center text-[13px] text-neutral-500">
                No timetable yet. Upload a photo or tap Edit to add your periods.
              </p>
            ) : (
              DAYS.map((day, idx) => {
                const dayRows = timetable
                  .filter((e) => e.day_of_week === idx)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                if (!dayRows.length) return null;
                return (
                  <section key={day}>
                    <h2 className="text-[14px] font-bold text-neutral-900">{day}</h2>
                    <ul className="mt-2 flex flex-col gap-2">
                      {dayRows.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-2.5"
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-neutral-700">
                            {e.period}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-neutral-900">
                              {e.subject}
                            </p>
                            <p className="text-[11px] text-neutral-500">
                              {fmt12(e.start_time)} – {fmt12(e.end_time)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        )}
      </main>
    </PhoneFrame>
  );
}
