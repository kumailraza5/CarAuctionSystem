import { useState } from "react";
import { useGetAuctions, GetAuctionsStatus } from "@workspace/api-client-react";
import { AuctionCard } from "@/components/auction-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, History, Clock } from "lucide-react";

export default function AuctionsList() {
  const [statusFilter, setStatusFilter] = useState<GetAuctionsStatus>("active");
  
  const { data, isLoading } = useGetAuctions({
    status: statusFilter,
    limit: 50
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-primary w-8 h-8" /> Auction Network
          </h1>
          <p className="text-muted-foreground font-mono mt-2">Real-time bidding environment for premium assets.</p>
        </div>
        
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as GetAuctionsStatus)} className="w-full md:w-auto">
          <TabsList className="bg-secondary/50 border border-border h-12 w-full md:w-auto">
            <TabsTrigger value="active" className="font-mono uppercase tracking-wider text-xs px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_10px_rgba(255,20,71,0.5)]">
              <Activity className="w-3 h-3 mr-2" /> Live
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="font-mono uppercase tracking-wider text-xs px-6 py-2.5">
              <Clock className="w-3 h-3 mr-2" /> Upcoming
            </TabsTrigger>
            <TabsTrigger value="ended" className="font-mono uppercase tracking-wider text-xs px-6 py-2.5">
              <History className="w-3 h-3 mr-2" /> History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-[420px] w-full rounded-sm" />)}
        </div>
      ) : (data?.auctions?.length ?? 0) === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-sm bg-secondary/5">
          <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-display font-bold uppercase text-muted-foreground">No Transmissions</h3>
          <p className="text-muted-foreground font-mono mt-2">There are currently no {statusFilter} auctions in the network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.auctions?.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
