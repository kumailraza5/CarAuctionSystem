import { Link } from "wouter";
import { Vehicle } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/api-url";
import { Gauge, Calendar, Zap } from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  // If no images, provide a sleek placeholder
  const raw = vehicle.images?.[0]?.trim();
  const imageUrl = raw
    ? resolveMediaUrl(raw)
    : "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800";

  return (
    <Card className="overflow-hidden group hover:border-primary/50 transition-colors duration-300 bg-card border-border flex flex-col h-full">
      <Link href={`/vehicles/${vehicle.id}`} className="block relative aspect-[16/9] overflow-hidden bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
        <img 
          src={imageUrl} 
          alt={vehicle.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {vehicle.status === "sold" && (
            <Badge variant="destructive" className="font-mono uppercase tracking-wider text-[10px]">Sold</Badge>
          )}
          {vehicle.hasActiveAuction && vehicle.status !== "sold" && (
            <Badge className="bg-primary hover:bg-primary font-mono uppercase tracking-wider text-[10px] animate-pulse">Live Auction</Badge>
          )}
          <Badge variant="secondary" className="font-mono uppercase tracking-wider text-[10px] bg-background/80 backdrop-blur-sm border-border">
            {vehicle.condition.replace(/_/g, ' ')}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 z-20">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight line-clamp-1">{vehicle.title}</h3>
          <p className="text-white/70 text-sm font-mono">{vehicle.make} {vehicle.model}</p>
        </div>
      </Link>
      
      <CardContent className="p-4 flex-1">
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-mono">{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-4 h-4 text-primary" />
            <span className="font-mono">{vehicle.mileage ? formatNumber(vehicle.mileage) : '--'} mi</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Est. Value</span>
          <span className="text-lg font-bold text-foreground font-mono">{formatCurrency(vehicle.price)}</span>
        </div>
        {vehicle.buyNowPrice && vehicle.status !== "sold" && (
          <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-1 text-xs font-mono font-bold text-primary hover:text-primary/80 transition-colors uppercase border border-primary/30 px-2 py-1 rounded-sm">
            <Zap className="w-3 h-3" /> Buy Now
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
