import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | ReachInbox Email Scheduler" },
      {
        name: "description",
        content: "Sign in with Google to schedule and track your cold email campaigns.",
      },
      { property: "og:title", content: "Sign in | ReachInbox Email Scheduler" },
      {
        property: "og:description",
        content: "Sign in with Google to schedule and track your cold email campaigns.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto mb-5 flex size-11 items-center justify-center rounded-xl bg-primary">
          <Send className="size-5 text-primary-foreground" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">ReachInbox Scheduler</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to schedule campaigns and track every send.
        </p>
        <Button className="mt-6 w-full" onClick={signIn} disabled={busy}>
          {busy ? "Opening Google..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}
