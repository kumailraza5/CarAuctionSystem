import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchListingMessages, postListingMessage, fetchListingThreads } from "@/lib/listing-messages-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Loader2, ChevronLeft, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";
import type { Vehicle } from "@workspace/api-client-react";

type Props = { vehicle: Vehicle };

export function VehicleListingChat({ vehicle }: Props) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [activeBuyerId, setActiveBuyerId] = useState<number | null>(null);

  const canShow =
    !!user &&
    (user.role === "admin" ||
      vehicle.sellerId === user.id ||
      (vehicle.buyerId != null && vehicle.buyerId === user.id) ||
      (vehicle.status === "approved" && user.role === "buyer" && vehicle.sellerId !== user.id));

  const isSellerOrAdmin = user?.role === "admin" || vehicle.sellerId === user?.id;
  const isListView = isSellerOrAdmin && activeBuyerId === null;

  const { data: threads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ["listing-threads", vehicle.id, token],
    queryFn: () => fetchListingThreads(vehicle.id, token),
    enabled: !!token && canShow && isSellerOrAdmin,
  });

  const targetBuyerId = isSellerOrAdmin ? activeBuyerId : undefined;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["listing-messages", vehicle.id, token, targetBuyerId],
    queryFn: () => fetchListingMessages(vehicle.id, token, targetBuyerId ?? undefined),
    enabled: !!token && canShow && (!isSellerOrAdmin || targetBuyerId != null),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => postListingMessage(vehicle.id, token, body, targetBuyerId ?? undefined),
    onSuccess: () => {
      // Refresh both messages and the thread list to ensure data is in sync
      queryClient.refetchQueries({ queryKey: ["listing-messages", vehicle.id] });
      queryClient.refetchQueries({ queryKey: ["listing-threads", vehicle.id] });
      setText("");
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Communication Failure",
        description: err.message || "Failed to send message to the server."
      });
    }
  });

  if (!canShow) return null;

  return (
    <Card className="border-border mt-8">
      <CardHeader className="border-b border-border/50 bg-secondary/20">
        <CardTitle className="font-display uppercase text-sm tracking-wider flex items-center gap-2">
          {(!isListView && isSellerOrAdmin) ? (
            <Button variant="ghost" size="sm" onClick={() => setActiveBuyerId(null)} className="h-6 px-2 mr-1">
              <ChevronLeft className="w-4 h-4 mr-1"/> Back to Inbox
            </Button>
          ) : (
             <MessageSquare className="w-4 h-4" />
          )}
          {isListView ? 'Prospect Inboxes' : 'Conversation'}
        </CardTitle>
        {isSellerOrAdmin && isListView && (
          <CardDescription className="font-mono text-[11px] text-muted-foreground pt-1 leading-relaxed">
            Select a prospective buyer below to view and reply to their messages privately.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isListView ? (
          <div className="space-y-3 font-mono text-sm max-h-64 overflow-y-auto">
            {loadingThreads ? (
              <p className="text-muted-foreground text-xs uppercase">Scanning frequencies...</p>
            ) : threads.length === 0 ? (
              <p className="text-muted-foreground text-xs">No active conversations yet.</p>
            ) : (
              threads.map((t) => (
                <div
                  key={t.buyerId}
                  onClick={() => setActiveBuyerId(t.buyerId)}
                  className="rounded-sm p-3 border border-border bg-secondary/20 hover:border-primary/40 hover:bg-primary/5 cursor-pointer flex items-center transition-colors"
                >
                  <UserCircle className="w-5 h-5 mr-3 text-muted-foreground" />
                  <span className="font-bold flex-1 text-foreground">{t.buyerName}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto space-y-3 font-mono text-sm">
              {loadingMessages ? (
                <p className="text-muted-foreground text-xs uppercase">Loading thread...</p>
              ) : messages.length === 0 ? (
                <p className="text-muted-foreground text-xs">Start the conversation below.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-sm p-3 border ${
                      m.authorId === user?.id ? "border-primary/40 bg-primary/5 ml-8" : "border-border bg-secondary/20 mr-8"
                    }`}
                  >
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase mb-1">
                      <span>{m.authorName}</span>
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))
              )}
            </div>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const b = text.trim();
                if (!b || sendMutation.isPending) return;
                sendMutation.mutate(b);
              }}
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isSellerOrAdmin ? "Reply privately..." : "Message the seller privately..."}
                className="font-mono bg-secondary/30 min-h-[80px] text-sm"
              />
              <Button type="submit" disabled={!text.trim() || sendMutation.isPending} className="font-display uppercase text-xs tracking-wider">
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
