import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetAuctions, useGetVehicles, useCreateAuction, getGetAuctionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Gavel, Plus, Activity, Loader2 } from "lucide-react";

const auctionSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Asset required"),
  startPrice: z.coerce.number().min(1, "Start price required"),
  reservePrice: z.coerce.number().optional().nullable(),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
});

export default function SellerAuctions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { data, isLoading } = useGetAuctions({ limit: 100 });
  const { data: vehiclesData } = useGetVehicles({ sellerId: user?.id, status: "approved" }, { query: { enabled: !!user?.id } as any });


  const sellerAuctions = data?.auctions.filter(a => a.vehicle.sellerId === user?.id) || [];
  const availableVehicles = vehiclesData?.vehicles.filter(v => !v.hasActiveAuction && v.status === "approved") || [];

  const createMutation = useCreateAuction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Protocol Initiated", description: "Auction has been successfully scheduled." });
        queryClient.invalidateQueries({ queryKey: getGetAuctionsQueryKey() });
        setIsAddOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Initialization Failed", description: err.response?.data?.error || "Could not schedule auction." });
      }
    }
  });

  const form = useForm<z.infer<typeof auctionSchema>>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      vehicleId: 0,
      startPrice: 0,
      reservePrice: null,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16), // 7 days from now
    }
  });

  const onSubmit = (values: z.infer<typeof auctionSchema>) => {
    createMutation.mutate({
      data: {
        ...values,
        reservePrice: values.reservePrice || undefined,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString()
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
            <Gavel className="w-8 h-8 text-primary" /> Auction Control
          </h1>
          <p className="text-muted-foreground font-mono mt-2 text-sm">Monitor and deploy your auction protocols.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-display uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(255,20,71,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Initialize Auction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-xl">Deploy Protocol</DialogTitle>
              <DialogDescription className="font-mono text-xs uppercase">Configure a new auction for an approved asset.</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Target Asset</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : undefined}>
                        <FormControl>
                          <SelectTrigger className="font-mono bg-secondary/50">
                            <SelectValue placeholder="Select an available asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles.map(v => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.title} ({v.year})</SelectItem>
                          ))}
                          {availableVehicles.length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground font-mono">No available assets.</div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startPrice" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Start Price</FormLabel><FormControl><Input type="number" {...field} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="reservePrice" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Reserve Price (Opt)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} className="font-mono bg-secondary/50 block w-full" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">End Time</FormLabel><FormControl><Input type="datetime-local" {...field} className="font-mono bg-secondary/50 block w-full" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                </div>

                <Button type="submit" disabled={createMutation.isPending || availableVehicles.length === 0} className="w-full font-display uppercase tracking-widest mt-4">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Execute Protocol
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center font-mono">Syncing auction data...</div>
        ) : !sellerAuctions.length ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Gavel className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <p className="font-mono text-muted-foreground uppercase text-sm">No active protocols detected.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border">
                <TableHead className="font-mono uppercase text-xs tracking-widest">Protocol / Asset</TableHead>
                <TableHead className="font-mono uppercase text-xs tracking-widest">Status</TableHead>
                <TableHead className="font-mono uppercase text-xs tracking-widest">Current Valuation</TableHead>
                <TableHead className="font-mono uppercase text-xs tracking-widest">End Time</TableHead>
                <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellerAuctions.map((a) => (
                <TableRow key={a.id} className="border-border group">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-display uppercase text-sm">{a.vehicle.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">Protocol ID: #{a.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'active' ? 'default' : 'outline'} className={`font-mono text-[10px] uppercase ${a.status === 'active' ? 'bg-primary animate-pulse border-none shadow-[0_0_10px_rgba(255,20,71,0.5)]' : ''}`}>
                      {a.status === 'active' && <Activity className="w-3 h-3 mr-1" />}
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`font-mono font-bold ${a.status === 'active' ? 'text-primary' : ''}`}>{formatCurrency(a.currentPrice)}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{a.bidCount} Bids</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateTime(a.endTime)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild className="font-mono uppercase text-[10px] h-8">
                      <Link href={`/auctions/${a.id}`}>View Grid</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
