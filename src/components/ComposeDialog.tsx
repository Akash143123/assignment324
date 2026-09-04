import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseRecipients, scheduleCampaign } from "@/lib/emails";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled: () => void;
}

function localNowValue(): string {
  const now = new Date(Date.now() + 60_000);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function ComposeDialog({ open, onOpenChange, onScheduled }: ComposeDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sender, setSender] = useState("no-reply@reachinbox.dev");
  const [startAt, setStartAt] = useState(localNowValue());
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    const list = parseRecipients(text);
    setRecipients(list);
    setFileName(file.name);
    if (list.length === 0) toast.error("No email addresses found in that file.");
  }

  function reset() {
    setSubject("");
    setBody("");
    setRecipients([]);
    setFileName("");
    setStartAt(localNowValue());
  }

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("Upload a CSV or text file with lead emails.");
      return;
    }
    setSubmitting(true);
    try {
      const count = await scheduleCampaign({
        subject: subject.trim(),
        body: body.trim(),
        sender: sender.trim(),
        startAt: new Date(startAt),
        delaySeconds,
        hourlyLimit,
        recipients,
      });
      toast.success(`${count} emails scheduled.`);
      reset();
      onOpenChange(false);
      onScheduled();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule emails.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compose new email</DialogTitle>
          <DialogDescription>
            Upload your leads and pick when the sequence should start.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sender">From</Label>
            <Input id="sender" value={sender} onChange={(e) => setSender(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Quick question about your outreach"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              rows={5}
              placeholder="Hi there, ..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Leads file (CSV or text)</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Upload className="size-4" />
              {fileName || "Click to upload a CSV or .txt file"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            {recipients.length > 0 && (
              <p className="text-sm text-success">{recipients.length} email addresses detected</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="start">Start time</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="delay">Delay between emails (sec)</Label>
              <Input
                id="delay"
                type="number"
                min={1}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Hourly limit</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Scheduling..." : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
