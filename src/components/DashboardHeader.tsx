import { LogOut, Send } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { avatarUrl, displayName } from "@/hooks/useAuth";

export function DashboardHeader({ user, onLogout }: { user: User; onLogout: () => void }) {
  const name = displayName(user);

  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Send className="size-4 text-primary-foreground" />
          </span>
          <span className="text-base font-semibold tracking-tight">ReachInbox Scheduler</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Avatar className="size-9">
            <AvatarImage src={avatarUrl(user)} alt={name} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" aria-label="Log out" onClick={onLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
