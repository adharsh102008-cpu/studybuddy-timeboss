import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "StudyFlow — Student Time Management" },
      {
        name: "description",
        content:
          "Plan your timetable, capture homework, focus with Pomodoro and get ready for tomorrow — all in one student app.",
      },
      { property: "og:title", content: "StudyFlow — Student Time Management" },
      {
        property: "og:description",
        content:
          "Plan your timetable, capture homework, focus with Pomodoro and get ready for tomorrow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setShowCta(true);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.session.user.id)
        .maybeSingle();
      navigate({ to: profile?.onboarded ? "/home" : "/onboarding", replace: true });
    }, 1400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-6 font-sans">
      <div className="relative flex h-[667px] max-h-[calc(100vh-3rem)] w-full max-w-[380px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
        <div className="animate-in fade-in zoom-in-95 flex flex-col items-center duration-700">
          <div
            className="grid size-20 place-items-center rounded-3xl text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
          >
            <GraduationCap size={40} strokeWidth={2.25} />
          </div>
          <h1 className="mt-5 text-[26px] font-bold tracking-tight text-neutral-900">
            StudyFlow
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">Your day, sorted.</p>
        </div>

        <div className="absolute bottom-10 w-full px-8">
          {showCta ? (
            <button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              className="animate-in fade-in slide-in-from-bottom-2 w-full rounded-xl py-3 text-[14px] font-semibold text-white duration-500 hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: "#3b82f6" }}
            >
              Get Started
            </button>
          ) : (
            <div className="mx-auto h-1 w-24 overflow-hidden rounded-full bg-[#f0f0f0]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#8b5cf6]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
