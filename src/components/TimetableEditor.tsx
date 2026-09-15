import { Trash2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DAYS, type TimetableEntry } from "@/lib/data";
import { inputClass } from "@/components/PhoneFrame";

/** Time field that keeps its own buffer so digits can be cleared/retyped freely. */
function TimeField({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  className: string;
}) {
  const [text, setText] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value);
  }, [value]);

  return (
    <input
      className={className}
      type="time"
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value) onCommit(e.target.value);
      }}
      onBlur={() => {
        focused.current = false;
        if (!text) setText(value);
        else onCommit(text);
      }}
    />
  );
}

/** Number field that allows the input to be emptied while typing. */
function NumberField({
  value,
  onCommit,
  className,
  min,
  max,
  fallback,
}: {
  value: number;
  onCommit: (v: number) => void;
  className: string;
  min: number;
  max: number;
  fallback: number;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      className={className}
      type="number"
      min={min}
      max={max}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() !== "" && Number.isFinite(n)) onCommit(n);
      }}
      onBlur={() => {
        focused.current = false;
        const n = Number(text);
        const next = text.trim() === "" || !Number.isFinite(n) ? fallback : n;
        setText(String(next));
        onCommit(next);
      }}
    />
  );
}

export type DraftRow = Omit<TimetableEntry, "id" | "user_id">;

export function emptyRow(day = 1, period = 1): DraftRow {
  return { day_of_week: day, period, subject: "", start_time: "09:00", end_time: "09:45" };
}

export function TimetableEditor({
  rows,
  onChange,
}: {
  rows: DraftRow[];
  onChange: (rows: DraftRow[]) => void;
}) {
  function update(index: number, patch: Partial<DraftRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <p className="rounded-xl bg-[#f0f0f0] px-4 py-6 text-center text-[13px] text-neutral-500">
          No periods yet. Add your first one below.
        </p>
      ) : null}

      {rows.map((row, i) => (
        <div key={i} className="rounded-xl bg-[#f0f0f0] p-3">
          <div className="flex items-center gap-2">
            <select
              className={inputClass}
              value={row.day_of_week}
              onChange={(e) => update(i, { day_of_week: Number(e.target.value) })}
            >
              {DAYS.map((d, idx) => (
                <option key={d} value={idx}>
                  {d}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Remove period"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#ef4444]"
            >
              <Trash2 size={16} strokeWidth={2.25} />
            </button>
          </div>

          <input
            className={`${inputClass} mt-2 bg-white`}
            placeholder="Subject"
            maxLength={60}
            value={row.subject}
            onChange={(e) => update(i, { subject: e.target.value })}
          />

          <div className="mt-2 grid grid-cols-3 gap-2">
            <label className="text-[11px] font-medium text-neutral-500">
              Period
              <NumberField
                className={`${inputClass} mt-1 bg-white`}
                min={1}
                max={20}
                fallback={1}
                value={row.period}
                onCommit={(v) => update(i, { period: v })}
              />
            </label>
            <label className="text-[11px] font-medium text-neutral-500">
              Start
              <TimeField
                className={`${inputClass} mt-1 bg-white`}
                value={row.start_time}
                onCommit={(v) => update(i, { start_time: v })}
              />
            </label>
            <label className="text-[11px] font-medium text-neutral-500">
              End
              <TimeField
                className={`${inputClass} mt-1 bg-white`}
                value={row.end_time}
                onCommit={(v) => update(i, { end_time: v })}
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          const last = rows[rows.length - 1];
          onChange([
            ...rows,
            emptyRow(last?.day_of_week ?? 1, last ? last.period + 1 : 1),
          ]);
        }}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 py-3 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-[#f6f6f6]"
      >
        <Plus size={16} strokeWidth={2.5} /> Add period
      </button>
    </div>
  );
}
