import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PhoneFrame, ScreenHeader } from "@/components/PhoneFrame";
import { TaskForm, emptyDraft, type TaskDraft } from "@/components/TaskForm";
import { useCreateTask } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/add")({
  head: () => ({
    meta: [
      { title: "Add work — StudyFlow" },
      {
        name: "description",
        content: "Quickly add an assignment, exam, revision or any extra task outside class.",
      },
      { property: "og:title", content: "Add work — StudyFlow" },
      {
        property: "og:description",
        content: "Quickly add an assignment, exam, revision or any extra task outside class.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddScreen,
});

function AddScreen() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft());
  const create = useCreateTask();

  return (
    <PhoneFrame>
      <ScreenHeader title="Add work" subtitle="Anything outside your timetable" />
      <main className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <TaskForm
          draft={draft}
          onChange={setDraft}
          submitLabel="Add task"
          busy={create.isPending}
          onSubmit={() => {
            create.mutate(
              {
                title: draft.title.trim(),
                description: draft.description.trim(),
                kind: draft.kind,
                subject: draft.subject.trim(),
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
            );
          }}
        />
      </main>
    </PhoneFrame>
  );
}
