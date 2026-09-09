import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetAuction,
  useGetAuctionBids,
  usePlaceBid,
  getGetAuctionQueryKey,
  getGetAuctionBidsQueryKey,
  ApiError,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/api-url";
import { CountdownTimer } from "@/components/countdown-timer";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, ShieldAlert, Gavel, ExternalLink, ArrowUpCircle, Zap } from "lucide-react";

function getApiErrorDetail(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data;
    if (d && typeof d === "object" && "error" in d && typeof (d as { error: unknown }).error === "string") {
      return (d as { error: string }).error;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Request failed.";
}

export default function AuctionDetail() {
  const params = useParams();
  const rawId = params.id;
  const parsedId = rawId != null && rawId !== "" ? Number(rawId) : NaN;
  const auctionIdOk = Number.isInteger(parsedId) && parsedId > 0;
  const auctionId = auctionIdOk ? parsedId : 0;

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(false);

  const {
    data: auction,
    isPending: isAuctionPending,
    isError: isAuctionError,
    error: auctionError,
  } = useGetAuction(auctionId, {
    query: {
      enabled: auctionIdOk,
      // Fall back to polling if Supabase realtime not available
      refetchInterval: isRealtime ? false : 15000,
    } as any,
  });

  const { data: bidsData } = useGetAuctionBids(auctionId, {
    query: {
      enabled: auctionIdOk,
      refetchInterval: isRealtime ? false : 15000,
    } as any,
  });

  // Supabase Realtime subscription for live bid updates
  useEffect(() => {
    if (!supabase || !auctionIdOk) return;

    const channel = supabase
      .channel(`auction-bids-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `auction_id=eq.${auctionId}`,
        },
        (_payload) => {
          // New bid arrived — refresh auction + bids instantly
          queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
          queryClient.invalidateQueries({ queryKey: getGetAuctionBidsQueryKey(auctionId) });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtime(true);
        } else {
          setIsRealtime(false);
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [auctionId, auctionIdOk, queryClient]);


  const placeBidMutation = usePlaceBid({
    mutation: {
      onSuccess: () => {
        toast({ title: "Bid Registered", description: "Your bid has been successfully transmitted to the network." });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionBidsQueryKey(auctionId) });
        form.reset({ amount: (auction?.currentPrice || 0) + 100 });
      },
      onError: (err: unknown) => {
        toast({ variant: "destructive", title: "Bid Rejected", description: getApiErrorDetail(err) || "Failed to place bid." });
      },
    },
  });

  const bidSchema = z.object({
    amount: z.coerce.number()
      .min((auction?.currentPrice || 0) + 1, "Must be higher than current bid")
  });

  const form = useForm<z.infer<typeof bidSchema>>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: 0
    }
  });

  // Update form default value when auction price changes
  useEffect(() => {
    if (auction && !form.formState.isDirty) {
      const minNext = auction.currentPrice > 0 ? auction.currentPrice + 100 : auction.startPrice;
      form.setValue("amount", minNext);
    }
  }, [auction, form]);

  if (!auctionIdOk) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <p className="font-mono uppercase text-destructive mb-4">Invalid auction link</p>
        <p className="text-muted-foreground font-mono text-sm mb-6">Use a numeric auction id from the auction list.</p>
        <Button asChild variant="outline">
          <Link href="/auctions">Back to auctions</Link>
        </Button>
      </div>
    );
  }

  if (auctionIdOk && isAuctionPending) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[280px] w-full max-w-4xl" />
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (isAuctionError) {
    const detail = getApiErrorDetail(auctionError);
    const is404 = auctionError instanceof ApiError && auctionError.status === 404;
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <p className="font-mono uppercase text-destructive mb-2">{is404 ? "Auction not found" : "Could not load auction"}</p>
        <p className="text-muted-foreground font-mono text-sm mb-2">{detail}</p>
        {!is404 && (
          <p className="text-muted-foreground font-mono text-xs mb-6">
            Confirm the API server is running (e.g. port 5000) and matches the app&apos;s configured API base URL.
          </p>
        )}
        <Button asChild variant="outline">
          <Link href="/auctions">Back to auctions</Link>
        </Button>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto py-20 text-center font-mono uppercase text-destructive">
        Auction protocol terminated or missing
      </div>
    );
  }

  if (!auction.vehicle) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <p className="font-mono uppercase text-destructive mb-4">Asset data unavailable</p>
        <p className="text-muted-foreground font-mono text-sm mb-6">This auction no longer has a linked vehicle record.</p>
        <Button asChild variant="outline">
          <Link href="/auctions">Back to auctions</Link>
        </Button>
      </div>
    );
  }

  const isLive = auction.status === "active";
  const isEnded = auction.status === "ended" || auction.status === "cancelled";
  const vehicle = auction.vehicle;
  const isHighestBidder = user && bidsData?.[0]?.userId === user.id;

  const onSubmit = (data: z.infer<typeof bidSchema>) => {
    placeBidMutation.mutate({ auctionId, data: { amount: data.amount } });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-secondary/10 border border-border p-6 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {isLive && <Badge className="bg-primary animate-pulse font-mono rounded-none"><Activity className="w-3 h-3 mr-1" /> LIVE</Badge>}
                {isEnded && <Badge variant="outline" className="font-mono rounded-none border-destructive text-destructive">ENDED</Badge>}
                <Badge variant="outline" className="font-mono rounded-none font-normal">Protocol #{auction.id}</Badge>
                {isRealtime && (
                  <Badge variant="outline" className="font-mono rounded-none border-green-500 text-green-500 text-[10px]">
                    <Zap className="w-2.5 h-2.5 mr-1" /> REALTIME
                  </Badge>
                )}
              </div>
              <Link href={`/vehicles/${vehicle.id}`} className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Asset Profile <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight mb-2">
              {vehicle.title}
            </h1>
            <p className="text-muted-foreground font-mono text-lg mb-6">
              {vehicle.make} {vehicle.model} • {vehicle.year}
            </p>

            <div className="relative aspect-video bg-background border border-border overflow-hidden mb-6 group">
              <img 
                src={
                  vehicle.images?.[0]?.trim()
                    ? resolveMediaUrl(vehicle.images[0])
                    : "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1200"
                } 
                alt={vehicle.title} 
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">Starting Price</p>
                <p className="font-mono font-bold text-lg">{formatCurrency(auction.startPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">Bids Registered</p>
                <p className="font-mono font-bold text-lg">{auction.bidCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">Operator</p>
                <p className="font-mono font-bold text-lg">{vehicle.sellerName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Terminal */}
        <div className="space-y-6">
          {/* Main Console */}
          <div className={`border p-6 rounded-sm flex flex-col items-center justify-center text-center ${isLive ? 'border-primary shadow-[0_0_20px_rgba(255,20,71,0.15)] bg-primary/5' : 'border-border bg-card'}`}>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              {isEnded ? "Final Valuation" : "Current Valuation"}
            </p>
            <div className={`text-5xl font-mono font-bold tracking-tighter mb-6 ${isLive ? 'text-primary drop-shadow-[0_0_10px_rgba(255,20,71,0.4)]' : ''}`}>
              {formatCurrency(auction.currentPrice)}
            </div>
            
            <div className="w-full bg-background border border-border p-4 mb-6 relative overflow-hidden">
              {isLive && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-pulse" />}
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-2 text-center">
                {isLive ? "Time Remaining" : "Protocol Status"}
              </p>
              <div className="flex justify-center">
                {isLive || auction.status === "upcoming" ? (
                  <CountdownTimer 
                    endTime={isLive ? auction.endTime : auction.startTime} 
                    className="text-2xl"
                    onEnd={() => queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) })}
                  />
                ) : (
                  <span className="font-mono font-bold text-lg text-muted-foreground">OFFLINE</span>
                )}
              </div>
            </div>

            {/* Bidding Controls */}
            {isLive ? (
              <div className="w-full space-y-4">
                {isHighestBidder && (
                  <Alert className="bg-green-500/10 border-green-500/30 mb-4 rounded-none">
                    <ShieldAlert className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500 font-mono text-xs uppercase">
                      You hold the leading position.
                    </AlertDescription>
                  </Alert>
                )}
                
                {!user ? (
                  <Button asChild className="w-full font-display uppercase font-bold tracking-widest rounded-none h-12">
                    <Link href="/login">Authenticate to Bid</Link>
                  </Button>
                ) : user.id === vehicle.sellerId ? (
                  <Alert className="bg-secondary/50 border-border rounded-none text-left">
                    <AlertDescription className="font-mono text-xs text-muted-foreground uppercase">
                      Cannot bid on owned asset.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  className="h-14 pl-8 text-xl font-mono font-bold text-center bg-background border-border rounded-none focus-visible:ring-primary focus-visible:border-primary"
                                  data-testid="input-bid-amount"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="font-mono text-[10px] text-center" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={placeBidMutation.isPending}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase font-bold tracking-widest text-lg rounded-none shadow-[0_0_15px_rgba(255,20,71,0.4)] transition-all hover:scale-[1.02]"
                        data-testid="btn-place-bid"
                      >
                        {placeBidMutation.isPending ? "Transmitting..." : <><ArrowUpCircle className="w-5 h-5 mr-2" /> Execute Bid</>}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            ) : (
              <div className="w-full py-3 bg-secondary/30 border border-border text-center font-mono text-sm uppercase tracking-wider text-muted-foreground">
                Bidding Locked
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className="bg-card border border-border rounded-sm">
            <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
              <h3 className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <Gavel className="w-4 h-4" /> Transaction Log
              </h3>
              <span className="text-xs font-mono text-muted-foreground">{bidsData?.length || 0} Records</span>
            </div>
            <div className="h-[300px] overflow-y-auto p-0">
              {!bidsData || bidsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-mono text-muted-foreground uppercase p-4 text-center">
                  No network transactions recorded.
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {bidsData.map((bid, i) => (
                    <li key={bid.id} className={`p-4 flex items-center justify-between ${i === 0 ? 'bg-primary/5' : ''}`}>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold truncate max-w-[120px]">
                          {bid.userName}
                          {i === 0 && <span className="ml-2 text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded-sm">Lead</span>}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground mt-1">
                          {formatDateTime(bid.createdAt)}
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${i === 0 ? 'text-primary' : 'text-foreground'}`}>
                        {formatCurrency(bid.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
