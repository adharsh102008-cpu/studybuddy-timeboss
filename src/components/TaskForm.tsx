import { useState } from "react";
import { inputClass, PrimaryButton } from "@/components/PhoneFrame";
import { PRIORITIES, TASK_KINDS, todayISO, type Task } from "@/lib/data";

export type TaskDraft = {
  title: string;
  description: string;
  kind: string;
  subject: string;
  due_date: string;
  due_time: string;
  priority: string;
  estimated_minutes: number;
};

export function emptyDraft(partial: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: "",
    description: "",
    kind: "Assignment",
    subject: "",
    due_date: todayISO(),
    due_time: "",
    priority: "Medium",
    estimated_minutes: 30,
    ...partial,
  };
}

export function draftFromTask(task: Task): TaskDraft {
  return {
    title: task.title,
    description: task.description,
    kind: task.kind,
    subject: task.subject,
    due_date: task.due_date ?? "",
    due_time: task.due_time ?? "",
    priority: task.priority,
    estimated_minutes: task.estimated_minutes,
  };
}

export function TaskForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  busy,
}: {
  draft: TaskDraft;
  onChange: (d: TaskDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
  busy?: boolean;
}) {
  const [error, setError] = useState("");

  function submit() {
    if (!draft.title.trim()) {
      setError("Give your task a title.");
      return;
    }
    setError("");
    onSubmit();
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        className={inputClass}
        placeholder="Task title"
        maxLength={100}
        value={draft.title}
        onChange={(e) => onChange({ ...draft, title: e.target.value })}
      />
      <textarea
        className={`${inputClass} min-h-[72px] resize-none`}
        placeholder="Description (optional)"
        maxLength={1000}
        value={draft.description}
        onChange={(e) => onChange({ ...draft, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-medium text-neutral-500">
          Type
          <select
            className={`${inputClass} mt-1`}
            value={draft.kind}
            onChange={(e) => onChange({ ...draft, kind: e.target.value })}
          >
            {TASK_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-medium text-neutral-500">
          Subject
          <input
            className={`${inputClass} mt-1`}
            placeholder="Optional"
            maxLength={60}
            value={draft.subject}
            onChange={(e) => onChange({ ...draft, subject: e.target.value })}
          />
        </label>
        <label className="text-[11px] font-medium text-neutral-500">
          Due date
          <input
            className={`${inputClass} mt-1`}
            type="date"
            value={draft.due_date}
            onChange={(e) => onChange({ ...draft, due_date: e.target.value })}
          />
        </label>
        <label className="text-[11px] font-medium text-neutral-500">
          Due time
          <input
            className={`${inputClass} mt-1`}
            type="time"
            value={draft.due_time}
            onChange={(e) => onChange({ ...draft, due_time: e.target.value })}
          />
        </label>
        <label className="text-[11px] font-medium text-neutral-500">
          Priority
          <select
            className={`${inputClass} mt-1`}
            value={draft.priority}
            onChange={(e) => onChange({ ...draft, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-medium text-neutral-500">
          Estimated minutes
          <input
            className={`${inputClass} mt-1`}
            type="number"
            min={5}
            max={600}
            step={5}
            value={draft.estimated_minutes}
            onChange={(e) =>
              onChange({ ...draft, estimated_minutes: Number(e.target.value) || 30 })
            }
          />
        </label>
      </div>

      {error ? <p className="text-[12px] font-medium text-[#ef4444]">{error}</p> : null}

      <PrimaryButton onClick={submit} disabled={busy ?? false}>
        {submitLabel}
      </PrimaryButton>
    </div>
  );
}
