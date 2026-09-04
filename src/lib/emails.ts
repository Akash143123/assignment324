import { supabase } from "@/integrations/supabase/client";

export type EmailStatus = "scheduled" | "sending" | "sent" | "failed";

export interface EmailJob {
  id: string;
  campaign_id: string;
  recipient: string;
  subject: string;
  scheduled_at: string;
  status: EmailStatus;
  sent_at: string | null;
  error: string | null;
  preview_url: string | null;
}

export interface ScheduleInput {
  subject: string;
  body: string;
  sender: string;
  startAt: Date;
  delaySeconds: number;
  hourlyLimit: number;
  recipients: string[];
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function parseRecipients(raw: string): string[] {
  const matches = raw.match(EMAIL_RE) ?? [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

export async function fetchJobs(status: "pending" | "done"): Promise<EmailJob[]> {
  const statuses = status === "pending" ? ["scheduled", "sending"] : ["sent", "failed"];
  const { data, error } = await supabase
    .from("email_jobs")
    .select("*")
    .in("status", statuses)
    .order(status === "pending" ? "scheduled_at" : "sent_at", { ascending: status === "pending" })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as EmailJob[];
}

/**
 * Spreads recipients across time honouring the minimum delay between sends and
 * the hourly cap: once `hourlyLimit` sends are placed inside an hour window,
 * the remaining jobs roll over into the next window (order preserved).
 */
export function planSchedule(
  startAt: Date,
  delaySeconds: number,
  hourlyLimit: number,
  count: number,
): Date[] {
  const plan: Date[] = [];
  let cursor = startAt.getTime();
  let windowStart = cursor;
  let inWindow = 0;

  for (let i = 0; i < count; i += 1) {
    if (inWindow >= hourlyLimit) {
      windowStart += 3600_000;
      cursor = Math.max(cursor, windowStart);
      inWindow = 0;
    }
    plan.push(new Date(cursor));
    inWindow += 1;
    cursor += delaySeconds * 1000;
  }
  return plan;
}

export async function scheduleCampaign(input: ScheduleInput): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You need to be signed in.");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      user_id: userId,
      subject: input.subject,
      body: input.body,
      sender: input.sender,
      start_at: input.startAt.toISOString(),
      delay_seconds: input.delaySeconds,
      hourly_limit: input.hourlyLimit,
      total_recipients: input.recipients.length,
    })
    .select("id")
    .single();

  if (campaignError || !campaign) throw new Error(campaignError?.message ?? "Could not save campaign");

  const times = planSchedule(
    input.startAt,
    input.delaySeconds,
    input.hourlyLimit,
    input.recipients.length,
  );

  const rows = input.recipients.map((recipient, i) => ({
    campaign_id: campaign.id,
    user_id: userId,
    recipient,
    subject: input.subject,
    scheduled_at: times[i]!.toISOString(),
    status: "scheduled" as const,
  }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("email_jobs").insert(rows.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }

  return rows.length;
}

/** Marks every due job as sent. Idempotent: only rows still `scheduled` are touched. */
export async function processDueJobs(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("email_jobs")
    .update({ status: "sent", sent_at: now })
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
