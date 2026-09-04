import { Inbox } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmailJob } from "@/lib/emails";

interface EmailTableProps {
  jobs: EmailJob[];
  loading: boolean;
  timeLabel: string;
  emptyTitle: string;
  emptyHint: string;
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmailTable({ jobs, loading, timeLabel, emptyTitle, emptyHint }: EmailTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
        <div className="rounded-full bg-muted p-3">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <p className="font-medium">{emptyTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-6 py-3 font-medium">Email</th>
            <th className="px-6 py-3 font-medium">Subject</th>
            <th className="px-6 py-3 font-medium">{timeLabel}</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="px-6 py-3.5 font-medium">{job.recipient}</td>
              <td className="max-w-xs truncate px-6 py-3.5 text-muted-foreground">{job.subject}</td>
              <td className="whitespace-nowrap px-6 py-3.5 text-muted-foreground">
                {formatTime(job.status === "sent" || job.status === "failed" ? job.sent_at : job.scheduled_at)}
              </td>
              <td className="px-6 py-3.5">
                <StatusBadge status={job.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
