import {
  useAdminGetStats,
  useAdminGetUsers,
  useGetVehicles,
  useAdminApproveVehicle,
  useAdminRejectVehicle,
  useAdminUpdateUserRole,
  getAdminGetStatsQueryKey,
  getGetVehiclesQueryKey,
  getAdminGetUsersQueryKey,
  UpdateRoleBodyRole,
  type VehicleListResponse,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CarFront, Gavel, Banknote, Activity, Check, X, ShieldAlert } from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/api-url";

/** Same params as `useGetVehicles` below — used for optimistic cache updates */
const PENDING_VEHICLES_QUERY_KEY = getGetVehiclesQueryKey({ status: "pending", limit: 50 });

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useAdminGetStats();
  const { data: pendingVehicles, isLoading: vehiclesLoading } = useGetVehicles({ status: "pending", limit: 50 });
  const { data: users, isLoading: usersLoading } = useAdminGetUsers();

  const approveMutation = useAdminApproveVehicle({
    mutation: {
      onMutate: async ({ vehicleId }) => {
        await queryClient.cancelQueries({ queryKey: PENDING_VEHICLES_QUERY_KEY });
        const previous = queryClient.getQueryData<VehicleListResponse>(PENDING_VEHICLES_QUERY_KEY);
        if (previous) {
          queryClient.setQueryData<VehicleListResponse>(PENDING_VEHICLES_QUERY_KEY, {
            vehicles: previous.vehicles.filter((v) => v.id !== vehicleId),
            total: Math.max(0, previous.total - 1),
          });
        }
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(PENDING_VEHICLES_QUERY_KEY, context.previous);
        }
      },
      onSuccess: () => {
        toast({ title: "Asset Approved", description: "Vehicle is now active on the network." });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
        await queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
    },
  });

  const rejectMutation = useAdminRejectVehicle({
    mutation: {
      onMutate: async ({ vehicleId }) => {
        await queryClient.cancelQueries({ queryKey: PENDING_VEHICLES_QUERY_KEY });
        const previous = queryClient.getQueryData<VehicleListResponse>(PENDING_VEHICLES_QUERY_KEY);
        if (previous) {
          queryClient.setQueryData<VehicleListResponse>(PENDING_VEHICLES_QUERY_KEY, {
            vehicles: previous.vehicles.filter((v) => v.id !== vehicleId),
            total: Math.max(0, previous.total - 1),
          });
        }
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(PENDING_VEHICLES_QUERY_KEY, context.previous);
        }
      },
      onSuccess: () => {
        toast({ variant: "destructive", title: "Asset Rejected", description: "Vehicle has been blocked." });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
        await queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
    },
  });

  const roleMutation = useAdminUpdateUserRole({
    mutation: {
      onSuccess: () => {
        toast({ title: "Clearance Updated", description: "Operator role has been modified." });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold uppercase tracking-tight flex items-center gap-3 text-destructive">
          <Activity className="w-8 h-8" /> Command Center
        </h1>
        <p className="text-muted-foreground font-mono mt-2">Global system overview and administrative overrides.</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-secondary/30 rounded-sm animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard title="Total Operators" value={formatNumber(stats?.totalUsers || 0)} icon={Users} />
          <StatCard title="Total Assets" value={formatNumber(stats?.totalVehicles || 0)} icon={CarFront} />
          <StatCard title="Active Protocols" value={formatNumber(stats?.activeAuctions || 0)} icon={Gavel} color="text-primary" />
          <StatCard title="Network Volume" value={formatCurrency(stats?.totalRevenue || 0)} icon={Banknote} color="text-green-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approvals */}
        <Card className="bg-card border-border rounded-sm flex flex-col h-[500px]">
          <CardHeader className="border-b border-border/50 bg-secondary/20 py-4">
            <CardTitle className="font-display uppercase text-sm tracking-wider flex justify-between items-center">
              Pending Asset Approvals
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground">{(pendingVehicles?.total ?? 0)} Awaiting</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {vehiclesLoading ? (
                <div className="p-8 text-center font-mono text-sm text-muted-foreground">Scanning network...</div>
              ) : !(pendingVehicles?.vehicles?.length ?? 0) ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <Check className="w-8 h-8 text-muted-foreground opacity-50 mb-3" />
                  <p className="font-mono text-sm text-muted-foreground uppercase">All assets processed.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {pendingVehicles?.vehicles?.map(v => (
                    <li key={v.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 bg-secondary rounded-sm overflow-hidden flex-shrink-0">
                          {v.images[0] && <img src={resolveMediaUrl(v.images[0])} alt="" className="w-full h-full object-cover grayscale" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display uppercase text-sm font-bold">{v.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">Operator: {v.sellerName} • Val: {formatCurrency(v.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => approveMutation.mutate({ vehicleId: v.id })}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate({ vehicleId: v.id })}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Operator Registry */}
        <Card className="bg-card border-border rounded-sm flex flex-col h-[500px]">
          <CardHeader className="border-b border-border/50 bg-secondary/20 py-4">
            <CardTitle className="font-display uppercase text-sm tracking-wider flex justify-between items-center">
              Operator Registry
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground">{users?.length || 0} Registered</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {usersLoading ? (
                <div className="p-8 text-center font-mono text-sm text-muted-foreground">Loading identity matrix...</div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {users?.map(u => (
                    <li key={u.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-display uppercase text-sm font-bold flex items-center gap-2">
                            {u.name} 
                            {u.role === 'admin' && <ShieldAlert className="w-3 h-3 text-destructive" />}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{u.email} • Joined: {formatDate(u.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          disabled={roleMutation.isPending} 
                          value={u.role} 
                          onValueChange={(val) => roleMutation.mutate({ userId: u.id, data: { role: val as UpdateRoleBodyRole } })}
                        >
                          <SelectTrigger className="h-8 font-mono text-xs w-[110px] bg-secondary/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">Buyer</SelectItem>
                            <SelectItem value="seller">Seller</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-muted-foreground" }: any) {
  return (
    <Card className="bg-card border-border rounded-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-2xl font-mono font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
