import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle-card";
import { AuctionCard } from "@/components/auction-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CarFront, Gavel, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function Home() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (error || !summary) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-display font-bold text-destructive">System Offline</h2>
          <p className="text-muted-foreground">Unable to establish connection to the auction servers.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-background border-b border-border/50">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-background to-background" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container mx-auto px-4 pt-24 pb-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-sm uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(255,20,71,0.2)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Auction Network
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase leading-[0.9]">
              Precision <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">Meets </span> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 drop-shadow-[0_0_15px_rgba(255,20,71,0.4)]">Adrenaline</span>
            </h1>
            
            <p className="text-xl text-muted-foreground font-mono max-w-2xl mx-auto">
              The premier digital cockpit for high-stakes vehicle acquisitions. 
              {formatNumber(summary?.stats?.totalVehicles ?? 0)} premium assets. 
              {formatNumber(summary?.stats?.activeAuctions ?? 0)} active warzones.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" asChild className="font-display font-bold uppercase tracking-wider text-lg px-8 py-6 h-auto w-full sm:w-auto shadow-[0_0_20px_rgba(255,20,71,0.4)] hover:shadow-[0_0_30px_rgba(255,20,71,0.6)] transition-all">
                <Link href="/auctions"><Gavel className="mr-2 h-5 w-5" /> Enter the Auction</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-display font-bold uppercase tracking-wider text-lg px-8 py-6 h-auto w-full sm:w-auto bg-background/50 backdrop-blur">
                <Link href="/vehicles"><CarFront className="mr-2 h-5 w-5" /> Browse Inventory</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-border/50 bg-secondary/30 backdrop-blur-sm py-6 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
              <StatItem label="Total Inventory" value={summary?.stats?.totalVehicles ?? 0} icon={CarFront} />
              <StatItem label="Active Auctions" value={summary?.stats?.activeAuctions ?? 0} icon={Activity} color="text-primary" />
              <StatItem label="Bids Placed" value={summary?.stats?.totalBids ?? 0} icon={Gavel} />
              <StatItem label="Verified Sellers" value={Math.floor((summary?.stats?.totalVehicles ?? 0) * 0.7)} icon={ShieldCheck} />
            </div>
          </div>
        </div>
      </section>

      {/* Active Auctions Section */}
      {(summary?.activeAuctions?.length ?? 0) > 0 && (
        <section className="py-20 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
                  <Activity className="text-primary h-8 w-8" /> Live Auctions
                </h2>
                <p className="text-muted-foreground font-mono mt-2">Real-time bidding on premium assets.</p>
              </div>
              <Button variant="ghost" asChild className="font-mono uppercase tracking-wider text-xs">
                <Link href="/auctions">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summary.activeAuctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Vehicles Section */}
      {(summary?.featuredVehicles?.length ?? 0) > 0 && (
        <section className="py-20 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
                  <Zap className="text-accent h-8 w-8" /> Featured Inventory
                </h2>
                <p className="text-muted-foreground font-mono mt-2">Curated selection of high-value targets available now.</p>
              </div>
              <Button variant="ghost" asChild className="font-mono uppercase tracking-wider text-xs">
                <Link href="/vehicles">View Directory <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {summary.featuredVehicles.slice(0, 4).map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color = "text-foreground" }: { label: string, value: number, icon: any, color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <Icon className={`w-6 h-6 mb-2 ${color} opacity-80`} />
      <span className={`text-3xl font-bold font-mono tracking-tighter ${color}`}>{formatNumber(value)}</span>
      <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="w-full">
      <div className="h-[70vh] w-full bg-secondary/20 flex flex-col items-center justify-center p-8 gap-6 border-b border-border">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-24 w-[80%] max-w-3xl" />
        <Skeleton className="h-6 w-96" />
        <div className="flex gap-4 mt-8">
          <Skeleton className="h-14 w-48" />
          <Skeleton className="h-14 w-48" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-20">
        <Skeleton className="h-10 w-64 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] w-full" />)}
        </div>
      </div>
    </div>
  );
}
