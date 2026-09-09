import { useLocation, useParams } from "wouter";
import { useGetVehicle, useBuyNow, getGetVehicleQueryKey, ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/api-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge, Calendar, Activity, CheckCircle, Zap, Image as ImageIcon } from "lucide-react";
import { VehicleListingChat } from "@/components/vehicle-listing-chat";

export default function VehicleDetail() {
  const params = useParams();
  const vehicleId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicle, isLoading, error } = useGetVehicle(vehicleId, {
    query: {
      enabled: !!vehicleId,
      queryKey: getGetVehicleQueryKey(vehicleId)
    }
  });

  const buyNowMutation = useBuyNow({
    mutation: {
      onSuccess: () => {
        toast({ title: "Purchase Complete", description: "You have successfully acquired this vehicle." });
        queryClient.invalidateQueries({ queryKey: getGetVehicleQueryKey(vehicleId) });
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof ApiError && err.data && typeof err.data === "object" && "error" in err.data
            ? String((err.data as { error: string }).error)
            : err instanceof Error
              ? err.message
              : "Unknown error occurred";
        toast({ variant: "destructive", title: "Purchase Failed", description: msg });
      },
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-[500px] w-full" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-display font-bold uppercase">Asset Not Found</h2>
        <p className="text-muted-foreground font-mono mt-2">The requested vehicle does not exist or has been removed.</p>
      </div>
    );
  }

  const imageList = vehicle.images?.filter((u) => typeof u === "string" && u.trim().length > 0) ?? [];
  const resolvedImages = imageList.map((u) => resolveMediaUrl(u));
  const imageUrl =
    resolvedImages[0] || "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1200";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6 flex flex-wrap gap-2">
        {vehicle.status === "sold" && (
          <Badge variant="destructive" className="font-mono uppercase tracking-wider">Sold</Badge>
        )}
        {vehicle.hasActiveAuction && vehicle.status !== "sold" && (
          <Badge className="bg-primary font-mono uppercase tracking-wider animate-pulse border-none">Active Auction</Badge>
        )}
        <Badge variant="outline" className="font-mono uppercase tracking-wider">{vehicle.condition.replace(/_/g, ' ')}</Badge>
        <Badge variant="outline" className="font-mono uppercase tracking-wider">ID: #{vehicle.id}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images Column */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] bg-secondary rounded-sm overflow-hidden border border-border">
            <img src={imageUrl} alt={vehicle.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
          </div>
          {resolvedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {resolvedImages.slice(1).map((img, idx) => (
                <div key={idx} className="aspect-[4/3] bg-secondary border border-border rounded-sm overflow-hidden opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                  <img src={img} alt={`${vehicle.title} detail ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col">
          <h1 className="text-4xl lg:text-5xl font-display font-bold uppercase tracking-tight mb-2">
            {vehicle.title}
          </h1>
          <p className="text-xl text-muted-foreground font-mono mb-8">
            {vehicle.make} {vehicle.model}
          </p>

          <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-secondary/20 border border-border/50 rounded-sm">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Model Year</p>
                <p className="font-mono text-lg font-bold">{vehicle.year}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Gauge className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Mileage</p>
                <p className="font-mono text-lg font-bold">{vehicle.mileage ? formatNumber(vehicle.mileage) : '--'} mi</p>
              </div>
            </div>
            <div className="flex items-start gap-3 col-span-2">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Verification</p>
                <p className="font-mono text-sm">Asset verified and authenticated by Apex Auto inspectors.</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-display font-bold uppercase text-sm mb-3">Asset Description</h3>
            <div className="prose prose-invert max-w-none text-muted-foreground font-mono text-sm leading-relaxed">
              {vehicle.description.split('\n').map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </div>

          <div className="mt-auto space-y-6 pt-6 border-t border-border">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Estimated Value</p>
                <p className="text-3xl font-mono font-bold">{formatCurrency(vehicle.price)}</p>
              </div>
              {vehicle.buyNowPrice && vehicle.status !== "sold" && (
                <div className="text-right">
                  <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Buy Now Price</p>
                  <p className="text-3xl font-mono font-bold text-primary">{formatCurrency(vehicle.buyNowPrice)}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {vehicle.buyNowPrice && vehicle.status !== "sold" && (
                <Button 
                  size="lg" 
                  className="flex-1 font-display uppercase tracking-widest font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(255,20,71,0.3)]"
                  onClick={() => {
                    if (!user) setLocation("/login");
                    else buyNowMutation.mutate({ vehicleId });
                  }}
                  disabled={buyNowMutation.isPending || (user?.role === "seller" && user?.id === vehicle.sellerId)}
                  data-testid="btn-buy-now"
                >
                  {buyNowMutation.isPending ? "Processing..." : <><Zap className="w-4 h-4 mr-2" /> Direct Purchase</>}
                </Button>
              )}
              {vehicle.hasActiveAuction && vehicle.status !== "sold" && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="flex-1 font-display uppercase tracking-widest font-bold"
                  onClick={() => setLocation("/auctions")} // Ideally link directly to the specific auction if we had the auction ID here
                >
                  <Activity className="w-4 h-4 mr-2" /> View Auction
                </Button>
              )}
            </div>
            
            <p className="text-center text-xs text-muted-foreground font-mono">
              Listed by operator <span className="font-bold text-foreground">{vehicle.sellerName}</span> on {formatDate(vehicle.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <VehicleListingChat vehicle={vehicle} />
    </div>
  );
}
