import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { inputClass, PrimaryButton } from "@/components/PhoneFrame";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — StudyFlow" },
      {
        name: "description",
        content: "Create your StudyFlow account or sign in to continue planning your study day.",
      },
      { property: "og:title", content: "Sign in — StudyFlow" },
      {
        property: "og:description",
        content: "Create your StudyFlow account or sign in to continue planning your study day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/onboarding", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/onboarding", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      toast.error("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/onboarding", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-6 font-sans">
      <div className="flex h-[667px] max-h-[calc(100vh-3rem)] w-full max-w-[380px] flex-col overflow-y-auto rounded-[20px] bg-white px-6 py-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          {mode === "signup"
            ? "A quick setup and you're ready to study."
            : "Sign in to pick up where you left off."}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {mode === "signup" ? (
            <input
              className={inputClass}
              placeholder="Your name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            value={password}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PrimaryButton onClick={submit} disabled={busy}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </PrimaryButton>
        </div>

        <div className="my-5 flex items-center gap-3 text-[11px] font-medium text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          OR
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <button
          type="button"
          onClick={google}
          className="w-full rounded-xl bg-[#f0f0f0] py-3 text-[14px] font-semibold text-neutral-800 transition-colors hover:bg-[#e6e6e6] active:scale-[0.99]"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 text-[13px] font-medium text-[#3b82f6]"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
