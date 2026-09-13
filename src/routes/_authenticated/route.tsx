import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useTasks } from "@/lib/data";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const FIRED_KEY = "studyflow.firedReminders";

function AuthenticatedLayout() {
  const { data: tasks } = useTasks();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tasks?.length) return;
    const check = () => {
      const fired: string[] = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]");
      const now = Date.now();
      tasks.forEach((task) => {
        if (!task.reminder_at || task.status === "Completed") return;
        if (fired.includes(task.id)) return;
        const due = new Date(task.reminder_at).getTime();
        if (due <= now && now - due < 6 * 60 * 60 * 1000) {
          fired.push(task.id);
          localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
          notify("Reminder", task.title, profile?.notification_sound ?? "chime");
          toast("Reminder: " + task.title, {
            action: {
              label: "Open",
              onClick: () => navigate({ to: "/task/$taskId", params: { taskId: task.id } }),
            },
          });
        }
      });
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [tasks, profile?.notification_sound, navigate]);

  return <Outlet />;
}
