import type { EmailStatus } from "@/lib/emails";

const styles: Record<EmailStatus, string> = {
  scheduled: "bg-accent text-accent-foreground",
  sending: "bg-warning/20 text-warning-foreground",
  sent: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: EmailStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
