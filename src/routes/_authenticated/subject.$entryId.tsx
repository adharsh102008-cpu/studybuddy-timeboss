import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { PhoneFrame, ScreenHeader, PrimaryButton } from "@/components/PhoneFrame";
import { TaskForm, emptyDraft, type TaskDraft } from "@/components/TaskForm";
import { fmt12, useCreateTask, useTasks, useTimetable } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/subject/$entryId")({
  head: () => ({
    meta: [
      { title: "Class period — StudyFlow" },
      {
        name: "description",
        content: "Add homework, classwork or revision given during this class period.",
      },
      { property: "og:title", content: "Class period — StudyFlow" },
      {
        property: "og:description",
        content: "Add homework, classwork or revision given during this class period.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubjectScreen,
});

function SubjectScreen() {
  const { entryId } = Route.useParams();
  const navigate = useNavigate();
  const { data: timetable = [] } = useTimetable();
  const { data: tasks = [] } = useTasks();
  const create = useCreateTask();
  const entry = timetable.find((e) => e.id === entryId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(() =>
    emptyDraft({ kind: "Homework" }),
  );

  const subjectTasks = tasks.filter(
    (t) => entry && t.subject.toLowerCase() === entry.subject.toLowerCase(),
  );

  function startAdding() {
    setDraft(emptyDraft({ kind: "Homework", subject: entry?.subject ?? "" }));
    setAdding(true);
  }

  return (
    <PhoneFrame>
      <ScreenHeader
        title={entry?.subject ?? "Class"}
        subtitle={
          entry
            ? `Period ${entry.period} · ${fmt12(entry.start_time)} – ${fmt12(entry.end_time)}`
            : "Period not found"
        }
        backTo="/home"
      />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        {adding ? (
          <div className="flex flex-col gap-3">
            <TaskForm
              draft={draft}
              onChange={setDraft}
              submitLabel="Save task"
              busy={create.isPending}
              onSubmit={() =>
                create.mutate(
                  {
                    title: draft.title.trim(),
                    description: draft.description.trim(),
                    kind: draft.kind,
                    subject: draft.subject.trim() || entry?.subject || "",
                    due_date: draft.due_date || null,
                    due_time: draft.due_time || null,
                    priority: draft.priority,
                    estimated_minutes: draft.estimated_minutes,
                    status: "Not Started",
                  },
                  {
                    onSuccess: () => {
                      toast.success("Task added");
                      navigate({ to: "/home" });
                    },
                    onError: () => toast.error("Could not save the task."),
                  },
                )
              }
            />
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-xl bg-[#f0f0f0] py-3 text-[13px] font-semibold text-neutral-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-[#f0f0f0] px-4 py-4">
              <p className="text-[14px] font-semibold text-neutral-900">
                Were you given any assignment, homework, classwork or task during this
                period?
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <PrimaryButton onClick={startAdding}>Yes, add it</PrimaryButton>
                <Link
                  to="/home"
                  className="rounded-xl bg-white py-3 text-center text-[13px] font-semibold text-neutral-700"
                >
                  No, nothing given
                </Link>
              </div>
            </div>

            <section>
              <h2 className="text-[14px] font-bold text-neutral-900">
                Work for this subject
              </h2>
              {subjectTasks.length === 0 ? (
                <p className="mt-2 text-[12px] text-neutral-500">Nothing added yet.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {subjectTasks.map((t) => (
                    <li key={t.id}>
                      <Link
                        to="/task/$taskId"
                        params={{ taskId: t.id }}
                        className="flex items-center gap-3 rounded-xl bg-[#f0f0f0] px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-neutral-900">
                            {t.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-neutral-500">
                            {t.kind} · {t.status}
                          </p>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-neutral-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </PhoneFrame>
  );
}
