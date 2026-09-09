import { useGetNotifications, useMarkNotificationRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications();
  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() })
    }
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'outbid': return <AlertTriangle className="w-5 h-5 text-primary" />;
      case 'auction_won': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'vehicle_approved': return <CheckCircle2 className="w-5 h-5 text-accent" />;
      case 'new_message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8 flex items-center gap-3 border-b border-border/50 pb-6">
        <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm">
          <Bell className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight">Comm Log</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">System notifications and alerts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 font-mono text-muted-foreground">Scanning frequencies...</div>
        ) : !notifications?.length ? (
          <div className="text-center py-20 border border-dashed border-border rounded-sm bg-secondary/10 font-mono text-muted-foreground">
            No incoming transmissions.
          </div>
        ) : (
          notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`p-4 rounded-sm border transition-colors cursor-pointer ${notif.isRead ? 'bg-background border-border/50 opacity-70' : 'bg-card border-primary/30 shadow-[0_0_10px_rgba(255,20,71,0.05)]'}`}
              onClick={() => {
                if (!notif.isRead) markReadMutation.mutate({ notificationId: notif.id });
              }}
            >
              <div className="flex gap-4 items-start">
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs uppercase tracking-widest font-bold text-foreground">
                      {notif.type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-2" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
