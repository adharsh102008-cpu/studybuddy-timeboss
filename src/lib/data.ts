import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- types ---------------- */

export type Profile = {
  id: string;
  name: string;
  student_type: string;
  preferred_study_times: string;
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  sessions_before_long_break: number;
  notification_sound: string;
  onboarded: boolean;
};

export type TimetableEntry = {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Sunday
  period: number;
  subject: string;
  start_time: string; // "HH:MM"
  end_time: string;
};

export type TaskStatus = "Not Started" | "In Progress" | "Completed";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  kind: string;
  subject: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  estimated_minutes: number;
  status: TaskStatus;
  reminder_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type PomodoroSession = {
  id: string;
  task_id: string | null;
  minutes: number;
  completed_at: string;
};

export type PrepItem = {
  id: string;
  prep_date: string;
  subject: string;
  item: string;
  prepared: boolean;
};

export const TASK_KINDS = [
  "Assignment",
  "Homework",
  "Classwork",
  "Revision",
  "Group Project",
  "Exam/Test",
  "Extra Task",
  "Other",
];

export const PRIORITIES = ["High", "Medium", "Low"];

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* ---------------- date/time helpers ---------------- */

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function tomorrowDate(d = new Date()) {
  const t = new Date(d);
  t.setDate(t.getDate() + 1);
  return t;
}

export function fmt12(t: string | null | undefined) {
  if (!t) return "";
  const [hStr, m] = t.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${(m ?? "00").padStart(2, "0")} ${suffix}`;
}

export function priorityRank(p: string) {
  return p === "High" ? 0 : p === "Medium" ? 1 : 2;
}

/** Smart ordering: due date, then priority, then shortest estimate. */
export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const ad = a.due_date ?? "9999-12-31";
    const bd = b.due_date ?? "9999-12-31";
    if (ad !== bd) return ad < bd ? -1 : 1;
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return a.estimated_minutes - b.estimated_minutes;
  });
}

/** Tasks that count towards "today": due today, overdue, or created today. */
export function tasksForDay(tasks: Task[], dayISO: string) {
  return tasks.filter((t) => {
    if (t.due_date) return t.due_date <= dayISO;
    return t.created_at.slice(0, 10) === dayISO;
  });
}

/* ---------------- queries ---------------- */

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const id = await uid();
      if (!id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Profile;
      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert({ id })
        .select("*")
        .single();
      if (insErr) throw insErr;
      return created as Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const id = await uid();
      if (!id) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useTimetable() {
  return useQuery({
    queryKey: ["timetable"],
    queryFn: async (): Promise<TimetableEntry[]> => {
      const { data, error } = await supabase
        .from("timetable_entries")
        .select("*")
        .order("day_of_week")
        .order("period");
      if (error) throw error;
      return (data ?? []) as TimetableEntry[];
    },
  });
}

export function useSaveTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<TimetableEntry, "id" | "user_id">[]) => {
      const id = await uid();
      if (!id) throw new Error("Not signed in");
      const { error: delErr } = await supabase
        .from("timetable_entries")
        .delete()
        .eq("user_id", id);
      if (delErr) throw delErr;
      if (rows.length) {
        const { error } = await supabase
          .from("timetable_entries")
          .insert(rows.map((r) => ({ ...r, user_id: id })));
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const id = await uid();
      if (!id) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: id })
        .select("*")
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async (): Promise<PomodoroSession[]> => {
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("id, task_id, minutes, completed_at")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PomodoroSession[];
    },
  });
}

export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, minutes }: { taskId: string; minutes: number }) => {
      const id = await uid();
      if (!id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("pomodoro_sessions")
        .insert({ user_id: id, task_id: taskId, minutes });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function usePrepItems(dateISO: string) {
  return useQuery({
    queryKey: ["prep", dateISO],
    queryFn: async (): Promise<PrepItem[]> => {
      const { data, error } = await supabase
        .from("prep_items")
        .select("id, prep_date, subject, item, prepared")
        .eq("prep_date", dateISO);
      if (error) throw error;
      return (data ?? []) as PrepItem[];
    },
  });
}

export const DEFAULT_PREP_ITEMS = ["Textbook", "Notebook", "Notes"];

export function useSyncPrepItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dateISO,
      subjects,
    }: {
      dateISO: string;
      subjects: string[];
    }) => {
      const id = await uid();
      if (!id) throw new Error("Not signed in");
      const rows = subjects.flatMap((subject) =>
        DEFAULT_PREP_ITEMS.map((item) => ({
          user_id: id,
          prep_date: dateISO,
          subject,
          item,
        })),
      );
      if (!rows.length) return;
      const { error } = await supabase
        .from("prep_items")
        .upsert(rows, { onConflict: "user_id,prep_date,subject,item", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["prep", vars.dateISO] }),
  });
}

export function useTogglePrep(dateISO: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, prepared }: { id: string; prepared: boolean }) => {
      const { error } = await supabase.from("prep_items").update({ prepared }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prep", dateISO] }),
  });
}

/* ---------------- derived scores ---------------- */

export function progressForToday(tasks: Task[]) {
  const today = todayISO();
  const list = tasksForDay(tasks, today);
  const completed = list.filter((t) => t.status === "Completed");
  const inProgress = list.filter((t) => t.status === "In Progress");
  const remaining = list.filter((t) => t.status !== "Completed");
  const percent = list.length ? Math.round((completed.length / list.length) * 100) : 0;
  const minutesLeft = remaining.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  return { list, completed, inProgress, remaining, percent, minutesLeft };
}

export function readinessScore(tasks: Task[], prep: PrepItem[]) {
  const { percent } = progressForToday(tasks);
  const prepPercent = prep.length
    ? Math.round((prep.filter((p) => p.prepared).length / prep.length) * 100)
    : 0;
  const score = Math.round(percent * 0.7 + prepPercent * 0.3);
  return { score, workPercent: percent, prepPercent };
}
