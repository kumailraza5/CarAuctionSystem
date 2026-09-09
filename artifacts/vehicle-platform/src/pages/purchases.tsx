import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyPurchases } from "@/lib/purchases-api";
import { formatCurrency, formatDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/api-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { VehicleListingChat } from "@/components/vehicle-listing-chat";
import { ShoppingBag, ArrowRight, MessageSquare } from "lucide-react";

export default function MyPurchases() {
  const { token } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["purchases", "mine", token],
    queryFn: () => fetchMyPurchases(token),
    enabled: !!token,
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" /> My Purchases
        </h1>
        <p className="text-muted-foreground font-mono mt-2 text-sm">Vehicles you bought with Direct Purchase.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-sm" />
          ))}
        </div>
      ) : isError ? (
        <p className="font-mono text-destructive text-sm">{error instanceof Error ? error.message : "Could not load purchases."}</p>
      ) : !data?.length ? (
        <Card className="border-dashed border-border bg-secondary/10">
          <CardContent className="py-12 text-center font-mono text-muted-foreground text-sm">
            No purchases yet. Browse approved listings with a buy-now price.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((v) => (
            <Card key={v.id} className="border-border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2 bg-secondary/20 border-b border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-12 bg-secondary rounded-sm overflow-hidden flex-shrink-0">
                    {v.images?.[0] ? (
                      <img src={resolveMediaUrl(v.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="font-display uppercase text-base truncate">{v.title}</CardTitle>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {v.make} {v.model} · {v.year} · Purchased {formatDate(v.updatedAt ?? v.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xs text-muted-foreground uppercase">Paid</p>
                  <p className="font-mono font-bold text-primary">{formatCurrency(v.buyNowPrice ?? v.price)}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="font-mono uppercase text-xs">
                  <Link href={`/vehicles/${v.id}`}>
                    View listing <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="font-mono uppercase text-xs">
                      <MessageSquare className="w-4 h-4 mr-2" /> Inbox
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] border-border bg-background p-0">
                    <VehicleListingChat vehicle={v} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
