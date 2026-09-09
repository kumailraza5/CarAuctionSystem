import { Link } from "wouter";
import { Auction } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/api-url";
import { CountdownTimer } from "./countdown-timer";
import { Activity, Users } from "lucide-react";

interface AuctionCardProps {
  auction: Auction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const vehicle = auction.vehicle;
  const raw = vehicle.images?.[0]?.trim();
  const imageUrl = raw
    ? resolveMediaUrl(raw)
    : "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800";

  const isLive = auction.status === "active";
  const isUpcoming = auction.status === "upcoming";
  const isEnded = auction.status === "ended" || auction.status === "cancelled";

  return (
    <Card className={`overflow-hidden group transition-colors duration-300 bg-card border-border flex flex-col h-full ${isLive ? 'border-primary/50 shadow-[0_0_15px_rgba(255,20,71,0.1)]' : ''}`}>
      <Link href={`/auctions/${auction.id}`} className="block relative aspect-[16/9] overflow-hidden bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10" />
        <img 
          src={imageUrl} 
          alt={vehicle.title}
          className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ${isEnded ? 'grayscale opacity-70' : ''}`}
          loading="lazy"
        />
        
        <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {isLive && (
              <Badge className="bg-primary hover:bg-primary text-primary-foreground font-mono uppercase tracking-wider text-[10px] shadow-[0_0_10px_rgba(255,20,71,0.5)] border-none">
                <Activity className="w-3 h-3 mr-1 animate-pulse" /> Live Now
              </Badge>
            )}
            {isUpcoming && (
              <Badge variant="secondary" className="font-mono uppercase tracking-wider text-[10px] bg-background/80 backdrop-blur-sm">
                Upcoming
              </Badge>
            )}
            {isEnded && (
              <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px] bg-background/80 backdrop-blur-sm text-muted-foreground border-muted">
                Ended
              </Badge>
            )}
          </div>
          
          <div className="bg-background/80 backdrop-blur-sm border border-border rounded-sm px-2 py-1 flex items-center gap-1.5 text-xs font-mono shadow-sm">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="font-bold">{auction.bidCount} <span className="text-muted-foreground font-normal">Bids</span></span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-20">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight line-clamp-1">{vehicle.title}</h3>
          <p className="text-white/70 text-sm font-mono">{vehicle.year} • {vehicle.make}</p>
        </div>
      </Link>
      
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-end border-b border-border/50 pb-3 mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              {isUpcoming ? 'Starting Bid' : (isEnded ? 'Final Bid' : 'Current Bid')}
            </span>
            <span className={`text-2xl font-bold font-mono ${isLive ? 'text-primary drop-shadow-[0_0_8px_rgba(255,20,71,0.3)]' : 'text-foreground'}`}>
              {formatCurrency(auction.currentPrice)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col bg-secondary/50 rounded-sm p-3 border border-border">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">
            {isUpcoming ? 'Starts In' : (isLive ? 'Time Remaining' : 'Status')}
          </span>
          {isLive || isUpcoming ? (
            <CountdownTimer 
              endTime={isLive ? auction.endTime : auction.startTime} 
            />
          ) : (
            <div className="font-mono font-bold text-muted-foreground">
              {auction.status === "cancelled" ? "CANCELLED" : "AUCTION CLOSED"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
