import { useState } from "react";
import { useGetVehicles, GetVehiclesStatus } from "@workspace/api-client-react";
import { VehicleCard } from "@/components/vehicle-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function VehiclesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const { data, isLoading } = useGetVehicles({
    status: "approved" as GetVehiclesStatus,
    search: debouncedSearch || undefined,
    limit: 50
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Asset Directory</h1>
          <p className="text-muted-foreground font-mono mt-2">Browse fully verified high-performance vehicles.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-md border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by make, model, or year..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-mono bg-background border-border"
              data-testid="input-search"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-sm font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-[380px] w-full rounded-sm" />)}
        </div>
      ) : (data?.vehicles?.length ?? 0) === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-sm bg-secondary/10">
          <p className="text-muted-foreground font-mono">No assets matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.vehicles?.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
