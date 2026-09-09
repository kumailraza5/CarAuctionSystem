import { useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, MapPin, Phone, Mail, Calendar } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function Profile() {
  const { user, logout } = useAuth();
  
  // Refetch user data to ensure freshness
  const { data: profileData, isLoading } = useGetMe({
    query: {
      enabled: !!user,
    }
  });

  const displayUser = profileData || user;

  if (isLoading || !displayUser) {
    return <div className="min-h-[60vh] flex items-center justify-center font-mono">Loading operator profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Operator Profile</h1>
        <p className="text-muted-foreground font-mono mt-2">Manage your network identity and access credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 bg-card border-border rounded-sm">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-secondary border border-border flex items-center justify-center mb-4 overflow-hidden relative group">
              {displayUser.avatar ? (
                <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-mono text-[10px] uppercase text-white cursor-pointer">
                Update
              </div>
            </div>
            
            <h2 className="text-xl font-display font-bold uppercase tracking-tight">{displayUser.name}</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 border border-border rounded-sm mt-2">
              <Shield className={`w-3.5 h-3.5 ${displayUser.role === 'admin' ? 'text-destructive' : displayUser.role === 'seller' ? 'text-accent' : 'text-primary'}`} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{displayUser.role}</span>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2 bg-card border-border rounded-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-display uppercase text-lg tracking-wider">Identity Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Comm Link</p>
                  <p className="font-mono text-sm">{displayUser.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Secure Line</p>
                  <p className="font-mono text-sm">{displayUser.phone || "Not configured"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sector</p>
                  <p className="font-mono text-sm">{displayUser.location || "Classified"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Network Join Date</p>
                  <p className="font-mono text-sm">{formatDate(displayUser.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
