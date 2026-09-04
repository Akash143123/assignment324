import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ComposeDialog } from "@/components/ComposeDialog";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmailTable } from "@/components/EmailTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { fetchJobs, processDueJobs } from "@/lib/emails";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Email Job Scheduler Dashboard | ReachInbox" },
      {
        name: "description",
        content:
          "Schedule cold email campaigns, track scheduled and sent emails, and control send delay and hourly limits.",
      },
      { property: "og:title", content: "Email Job Scheduler Dashboard | ReachInbox" },
      {
        property: "og:description",
        content:
          "Schedule cold email campaigns, track scheduled and sent emails, and control send delay and hourly limits.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const scheduled = useQuery({
    queryKey: ["jobs", "pending"],
    queryFn: () => fetchJobs("pending"),
    enabled: Boolean(user),
    refetchInterval: 10_000,
  });

  const sent = useQuery({
    queryKey: ["jobs", "done"],
    queryFn: () => fetchJobs("done"),
    enabled: Boolean(user),
    refetchInterval: 10_000,
  });

  // Drains due jobs the same way a queue worker would; safe to run repeatedly.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const run = async () => {
      try {
        const count = await processDueJobs();
        if (active && count > 0) {
          void queryClient.invalidateQueries({ queryKey: ["jobs"] });
        }
      } catch {
        /* silent: the next tick retries */
      }
    };
    void run();
    const id = setInterval(run, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user, queryClient]);

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    void navigate({ to: "/auth" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={logout} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Email campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Queue outreach, throttle sends, and watch delivery in real time.
            </p>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="size-4" />
            Compose new email
          </Button>
        </div>

        <Tabs defaultValue="scheduled">
          <TabsList>
            <TabsTrigger value="scheduled">
              Scheduled ({scheduled.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="sent">Sent ({sent.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-4">
            <div className="rounded-xl border bg-card">
              <EmailTable
                jobs={scheduled.data ?? []}
                loading={scheduled.isLoading}
                timeLabel="Scheduled time"
                emptyTitle="No scheduled emails"
                emptyHint="Compose a new email and upload your leads to queue your first campaign."
              />
            </div>
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            <div className="rounded-xl border bg-card">
              <EmailTable
                jobs={sent.data ?? []}
                loading={sent.isLoading}
                timeLabel="Sent time"
                emptyTitle="Nothing sent yet"
                emptyHint="Emails appear here once their scheduled time passes."
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onScheduled={() => queryClient.invalidateQueries({ queryKey: ["jobs"] })}
      />
    </div>
  );
}
