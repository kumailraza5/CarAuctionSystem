import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetVehicles,
  useDeleteVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  getGetVehiclesQueryKey,
  CreateVehicleBodyCondition,
  ApiError,
  type Vehicle,
} from "@workspace/api-client-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { VehicleImageUrlsField } from "@/components/vehicle-image-urls-field";
import { VehicleListingChat } from "@/components/vehicle-listing-chat";
import { CarFront, Edit, Trash2, Plus, Loader2, MessageSquare } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api-url";

const vehicleSchema = z.object({
  title: z.string().min(3, "Title required"),
  make: z.string().min(1, "Make required"),
  model: z.string().min(1, "Model required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  buyNowPrice: z.coerce.number().optional().nullable(),
  mileage: z.coerce.number().optional().nullable(),
  condition: z.enum(["new", "used", "certified_pre_owned"]),
  description: z.string().min(10, "Description needed"),
  images: z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean))
});

/** PATCH /vehicles/:id — make/model/year are not editable via API */
const editVehicleSchema = z.object({
  title: z.string().min(3, "Title required"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  buyNowPrice: z.coerce.number().optional().nullable(),
  mileage: z.coerce.number().optional().nullable(),
  condition: z.enum(["new", "used", "certified_pre_owned"]),
  description: z.string().min(10, "Description needed"),
  images: z.string().transform((str) => str.split(",").map((s) => s.trim()).filter(Boolean)),
});

export default function SellerVehicles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading } = useGetVehicles({
    sellerId: user?.id,
    limit: 100
  }, {
    query: {
      enabled: !!user?.id
    }
  });

  const deleteMutation = useDeleteVehicle({
    mutation: {
      onSuccess: () => {
        toast({ title: "Asset Deleted", description: "Vehicle removed from the network." });
        queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey({ sellerId: user?.id }) });
      }
    }
  });

  const createMutation = useCreateVehicle({
    mutation: {
      onSuccess: () => {
        toast({ title: "Asset Created", description: "Vehicle submitted for network approval." });
        queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey({ sellerId: user?.id }) });
        setIsAddOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || "Failed to create vehicle." });
      }
    }
  });

  const updateMutation = useUpdateVehicle({
    mutation: {
      onSuccess: () => {
        toast({ title: "Listing updated", description: "Your changes have been saved." });
        queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey({ sellerId: user?.id }) });
        queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
        setEditingVehicle(null);
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof ApiError && err.data && typeof err.data === "object" && "error" in err.data
            ? String((err.data as { error: string }).error)
            : err instanceof Error
              ? err.message
              : "Failed to update listing.";
        toast({ variant: "destructive", title: "Error", description: msg });
      },
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("CONFIRM DELETION: Are you sure you want to permanently remove this asset?")) {
      deleteMutation.mutate({ vehicleId: id });
    }
  };

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      title: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      buyNowPrice: null,
      mileage: null,
      condition: "used",
      description: "",
      images: "",
    },
  });

  const editForm = useForm<z.infer<typeof editVehicleSchema>>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      title: "",
      price: 0,
      buyNowPrice: null,
      mileage: null,
      condition: "used",
      description: "",
      images: "",
    },
  });

  useEffect(() => {
    if (!editingVehicle) return;
    editForm.reset({
      title: editingVehicle.title,
      description: editingVehicle.description,
      price: editingVehicle.price,
      buyNowPrice: editingVehicle.buyNowPrice ?? null,
      mileage: editingVehicle.mileage ?? null,
      condition: editingVehicle.condition as z.infer<typeof editVehicleSchema>["condition"],
      images: editingVehicle.images?.length ? editingVehicle.images.join(", ") : "",
    });
  }, [editingVehicle, editForm]);

  const onSubmit = (values: z.infer<typeof vehicleSchema>) => {
    createMutation.mutate({
      data: {
        ...values,
        condition: values.condition as CreateVehicleBodyCondition,
        buyNowPrice: values.buyNowPrice || undefined,
        mileage: values.mileage || undefined,
        images: values.images.length > 0 ? values.images : ["https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800"]
      }
    });
  };

  const onSubmitEdit = (values: z.infer<typeof editVehicleSchema>) => {
    if (!editingVehicle) return;
    const imgs = values.images.length > 0 ? values.images : editingVehicle.images;
    updateMutation.mutate({
      vehicleId: editingVehicle.id,
      data: {
        title: values.title,
        description: values.description,
        price: values.price,
        buyNowPrice: values.buyNowPrice ?? null,
        mileage: values.mileage ?? null,
        condition: values.condition,
        images: imgs,
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
            <CarFront className="w-8 h-8 text-primary" /> Asset Management
          </h1>
          <p className="text-muted-foreground font-mono mt-2 text-sm">Control your vehicle listings on the network.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-display uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(255,20,71,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Add New Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-xl">Register Asset</DialogTitle>
              <DialogDescription className="font-mono text-xs uppercase">Submit a new vehicle for network approval.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Listing Title</FormLabel>
                      <FormControl><Input {...field} className="font-mono bg-secondary/50" /></FormControl>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="make" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Make</FormLabel><FormControl><Input {...field} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Model</FormLabel><FormControl><Input {...field} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Year</FormLabel><FormControl><Input type="number" {...field} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="mileage" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Mileage (mi)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Estimated Value</FormLabel><FormControl><Input type="number" {...field} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                  <FormField control={form.control} name="buyNowPrice" render={({ field }) => (
                    <FormItem><FormLabel className="font-mono uppercase text-xs">Buy Now Price (Opt)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="font-mono bg-secondary/50" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                  )} />
                </div>
                
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Condition</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono bg-secondary/50"><SelectValue placeholder="Select condition" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="certified_pre_owned">Certified Pre-Owned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Images</FormLabel>
                      <FormControl>
                        <VehicleImageUrlsField
                          value={typeof field.value === "string" ? field.value : ""}
                          onChange={field.onChange}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel className="font-mono uppercase text-xs">Description</FormLabel><FormControl><Textarea {...field} className="font-mono bg-secondary/50 min-h-[100px]" /></FormControl><FormMessage className="font-mono text-[10px]" /></FormItem>
                )} />

                <Button type="submit" disabled={createMutation.isPending} className="w-full font-display uppercase tracking-widest">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit Asset
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editingVehicle !== null}
          onOpenChange={(open) => {
            if (!open) setEditingVehicle(null);
          }}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-xl">Edit listing</DialogTitle>
              <DialogDescription className="font-mono text-xs uppercase">
                Update fields allowed by the network. Make, model, and year are fixed after listing creation.
              </DialogDescription>
            </DialogHeader>
            {editingVehicle && (
              <div className="rounded-sm border border-border bg-secondary/20 px-3 py-2 font-mono text-xs text-muted-foreground mb-2">
                {editingVehicle.make} {editingVehicle.model} · {editingVehicle.year}
              </div>
            )}
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Listing Title</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono bg-secondary/50" />
                      </FormControl>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono uppercase text-xs">Mileage (mi)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} className="font-mono bg-secondary/50" />
                        </FormControl>
                        <FormMessage className="font-mono text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono uppercase text-xs">Estimated Value</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="font-mono bg-secondary/50" />
                        </FormControl>
                        <FormMessage className="font-mono text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="buyNowPrice"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-mono uppercase text-xs">Buy Now Price (Opt)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} className="font-mono bg-secondary/50" />
                        </FormControl>
                        <FormMessage className="font-mono text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Condition</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="font-mono bg-secondary/50">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="certified_pre_owned">Certified Pre-Owned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Images</FormLabel>
                      <FormControl>
                        <VehicleImageUrlsField
                          value={field.value}
                          onChange={field.onChange}
                          disabled={updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase text-xs">Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="font-mono bg-secondary/50 min-h-[100px]" />
                      </FormControl>
                      <FormMessage className="font-mono text-[10px]" />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateMutation.isPending} className="w-full font-display uppercase tracking-widest">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save changes
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center font-mono">Loading inventory data...</div>
        ) : !data?.vehicles.length ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CarFront className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <p className="font-mono text-muted-foreground uppercase text-sm">No assets found in your inventory.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border">
                <TableHead className="font-mono uppercase text-xs tracking-widest">Asset</TableHead>
                <TableHead className="font-mono uppercase text-xs tracking-widest">Est. Value</TableHead>
                <TableHead className="font-mono uppercase text-xs tracking-widest">Status</TableHead>
                <TableHead className="font-mono uppercase text-xs tracking-widest">Added</TableHead>
                <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vehicles.map((v) => (
                <TableRow key={v.id} className="border-border group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-secondary rounded-sm overflow-hidden flex-shrink-0">
                        {v.images[0] && <img src={resolveMediaUrl(v.images[0])} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />}
                      </div>
                      <div className="flex flex-col">
                        <Link href={`/vehicles/${v.id}`} className="font-display uppercase text-sm hover:text-primary transition-colors">{v.title}</Link>
                        <span className="font-mono text-[10px] text-muted-foreground">{v.make} {v.model} • {v.year}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(v.price)}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'approved' ? 'default' : v.status === 'pending' ? 'secondary' : 'outline'} className={`font-mono text-[10px] uppercase ${v.status === 'approved' ? 'bg-accent/20 text-accent hover:bg-accent/30' : ''}`}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Inbox">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] border-border bg-background p-0">
                          <VehicleListingChat vehicle={v} />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Edit listing"
                        onClick={() => setEditingVehicle(v)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete listing" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
