import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import { CreateChannelDialog } from "@/features/rooms/components/CreateChannelDialog";
import { useChannels } from "@/features/rooms/hooks/useChannels";
import { ChannelsSection } from "@/features/rooms/components/sidebar/ChannelsSection";
import { DMsSection } from "@/features/rooms/components/sidebar/DMsSection";

export function AppSidebar() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: channels = [] } = useChannels();
  const existingNames = channels.map((r) => r.name);

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-bg-1/80 backdrop-blur">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent-blue via-accent-violet to-accent-fuchsia text-xs font-bold text-white">
          D
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-t1">dashway</span>
          <span className="text-[10px] uppercase tracking-wider text-t3">
            chat
          </span>
        </div>
      </div>

      <div className="p-3">
        <Button
          size="sm"
          className="w-full justify-center"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New channel
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 scrollbar-thin">
        <ChannelsSection />
        <DMsSection />
      </ScrollArea>

      <div className="border-t border-border p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <CreateChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingNames={existingNames}
      />
    </aside>
  );
}
