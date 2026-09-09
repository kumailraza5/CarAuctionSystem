import React from "react";
import { useParams } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

// ── Component Demos ──────────────────────────────────────────────────────────
import { VehicleCard } from "@/components/vehicle-card";
import { AuctionCard } from "@/components/auction-card";
import { CountdownTimer } from "@/components/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Gavel, Car, Activity, Users, Zap, Bell, CheckCircle2, AlertTriangle } from "lucide-react";

// ── Sample data for demos ────────────────────────────────────────────────────
const SAMPLE_VEHICLE: any = {
  id: "v-001",
  title: "2022 Porsche 911 GT3",
  make: "Porsche",
  model: "911 GT3",
  year: 2022,
  price: 189500,
  mileage: 4200,
  condition: "like_new",
  status: "available",
  hasActiveAuction: true,
  buyNowPrice: 195000,
  images: ["https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800"],
};

const SAMPLE_AUCTION: any = {
  id: "a-001",
  status: "active",
  currentPrice: 142000,
  startTime: new Date(Date.now() - 3600000).toISOString(),
  endTime: new Date(Date.now() + 7200000).toISOString(),
  bidCount: 17,
  vehicle: {
    ...SAMPLE_VEHICLE,
    title: "2021 Lamborghini Huracán",
    make: "Lamborghini",
    model: "Huracán",
    year: 2021,
    images: ["https://images.unsplash.com/photo-1621135802920-5e27e8f7e6a7?auto=format&fit=crop&q=80&w=800"],
  },
};

// ── Preview Registry ─────────────────────────────────────────────────────────
const PREVIEWS: Record<string, { title: string; description: string; render: () => JSX.Element }> = {
  VehicleCard: {
    title: "VehicleCard",
    description: "Displays a vehicle listing with image, details, and price.",
    render: () => (
      <div className="w-80">
        <VehicleCard vehicle={SAMPLE_VEHICLE} />
      </div>
    ),
  },

  AuctionCard: {
    title: "AuctionCard",
    description: "Live auction card with countdown timer and bid count.",
    render: () => (
      <div className="w-80">
        <AuctionCard auction={SAMPLE_AUCTION} />
      </div>
    ),
  },

  CountdownTimer: {
    title: "CountdownTimer",
    description: "Real-time countdown timer for auction end times.",
    render: () => (
      <div className="flex flex-col gap-6 items-center">
        <div className="w-64 bg-card border border-border rounded-sm p-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">Time Remaining</p>
          <CountdownTimer endTime={new Date(Date.now() + 7200000).toISOString()} />
        </div>
        <div className="w-64 bg-card border border-border rounded-sm p-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">Starts In</p>
          <CountdownTimer endTime={new Date(Date.now() + 86400000).toISOString()} />
        </div>
      </div>
    ),
  },

  Badge: {
    title: "Badge",
    description: "Status and label badges in all variants.",
    render: () => (
      <div className="flex flex-wrap gap-3 items-center">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge className="bg-primary font-mono uppercase tracking-wider text-[10px] animate-pulse">
          <Activity className="w-3 h-3 mr-1" /> Live Now
        </Badge>
        <Badge variant="secondary" className="font-mono uppercase text-[10px]">Upcoming</Badge>
        <Badge variant="outline" className="text-muted-foreground text-[10px] font-mono uppercase">Ended</Badge>
      </div>
    ),
  },

  Button: {
    title: "Button",
    description: "Interactive buttons in all sizes and variants.",
    render: () => (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex gap-3 items-center">
          <Button className="font-display uppercase tracking-widest shadow-[0_0_15px_rgba(255,20,71,0.3)] hover:shadow-[0_0_25px_rgba(255,20,71,0.6)] transition-all">
            <Gavel className="mr-2 h-4 w-4" /> Place Bid
          </Button>
          <Button variant="outline" className="font-mono uppercase tracking-wider">
            <Zap className="mr-2 h-4 w-4" /> Buy Now
          </Button>
        </div>
      </div>
    ),
  },

  Card: {
    title: "Card",
    description: "Content container card with header, content, and footer sections.",
    render: () => (
      <div className="w-96">
        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Operator Profile
            </CardTitle>
            <CardDescription className="font-mono text-xs uppercase tracking-widest">
              Account clearance level: Alpha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://i.pravatar.cc/150?img=3" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold font-mono">John Doe</p>
                <p className="text-xs text-muted-foreground font-mono">john.doe@apex.auto</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div className="text-muted-foreground">Bids Placed</div>
              <div className="font-bold text-right">24</div>
              <div className="text-muted-foreground">Vehicles Won</div>
              <div className="font-bold text-right text-primary">3</div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm" variant="outline" className="flex-1">Edit Profile</Button>
            <Button size="sm" className="flex-1">View History</Button>
          </CardFooter>
        </Card>
      </div>
    ),
  },

  Input: {
    title: "Input",
    description: "Text input field in various states.",
    render: () => (
      <div className="flex flex-col gap-4 w-72">
        <div className="space-y-1.5">
          <Label className="font-mono uppercase text-xs tracking-wider">Vehicle Title</Label>
          <Input placeholder="2022 Porsche 911 GT3" className="font-mono bg-secondary/50 border-border h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono uppercase text-xs tracking-wider">Starting Bid</Label>
          <Input type="number" placeholder="10000" className="font-mono bg-secondary/50 border-border h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Disabled</Label>
          <Input disabled placeholder="Read only field" className="font-mono h-11" />
        </div>
      </div>
    ),
  },

  Progress: {
    title: "Progress",
    description: "Progress bar component for loading and completion states.",
    render: () => (
      <div className="flex flex-col gap-6 w-80">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span>Auction Progress</span>
            <span>73%</span>
          </div>
          <Progress value={73} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span>Profile Completion</span>
            <span>45%</span>
          </div>
          <Progress value={45} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span>Verification</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>
      </div>
    ),
  },

  Tabs: {
    title: "Tabs",
    description: "Tabbed navigation for organising content sections.",
    render: () => (
      <div className="w-96">
        <Tabs defaultValue="active">
          <TabsList className="w-full font-mono">
            <TabsTrigger value="active" className="flex-1 uppercase tracking-wider text-xs">Active</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 uppercase tracking-wider text-xs">Upcoming</TabsTrigger>
            <TabsTrigger value="ended" className="flex-1 uppercase tracking-wider text-xs">Ended</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <Card>
              <CardContent className="pt-4 font-mono text-sm text-muted-foreground">
                3 active auctions running live now
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="upcoming">
            <Card>
              <CardContent className="pt-4 font-mono text-sm text-muted-foreground">
                7 auctions scheduled for this week
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ended">
            <Card>
              <CardContent className="pt-4 font-mono text-sm text-muted-foreground">
                42 auctions completed this month
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    ),
  },

  Alert: {
    title: "Alert",
    description: "System alerts for important messages and notifications.",
    render: () => (
      <div className="flex flex-col gap-4 w-96">
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="font-mono uppercase tracking-wider text-sm">Bid Confirmed</AlertTitle>
          <AlertDescription className="font-mono text-xs text-muted-foreground">
            Your bid of PKR 142,000 has been placed successfully.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-mono uppercase tracking-wider text-sm">Outbid</AlertTitle>
          <AlertDescription className="font-mono text-xs">
            Another operator has placed a higher bid. Minimum next bid: PKR 145,000.
          </AlertDescription>
        </Alert>
        <Alert className="border-primary/30 bg-primary/5">
          <Bell className="h-4 w-4 text-primary" />
          <AlertTitle className="font-mono uppercase tracking-wider text-sm text-primary">Auction Ending Soon</AlertTitle>
          <AlertDescription className="font-mono text-xs text-muted-foreground">
            This auction closes in under 30 minutes. Don't miss your chance.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },

  Skeleton: {
    title: "Skeleton",
    description: "Loading placeholders that mimic the shape of content.",
    render: () => (
      <div className="flex flex-col gap-6 w-80">
        <div className="space-y-3">
          <Skeleton className="h-[180px] w-full rounded-sm" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    ),
  },

  Avatar: {
    title: "Avatar",
    description: "User avatar with image fallback and sizing options.",
    render: () => (
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 items-end">
          {[12, 10, 8, 6].map((size) => (
            <Avatar key={size} className={`h-${size} w-${size}`}>
              <AvatarImage src={`https://i.pravatar.cc/150?img=${size}`} />
              <AvatarFallback className="font-mono font-bold">OP</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-mono font-bold">AD</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold font-mono">Admin User</p>
            <p className="text-xs text-muted-foreground font-mono">admin@apex.auto</p>
          </div>
        </div>
      </div>
    ),
  },

  Switch: {
    title: "Switch",
    description: "Toggle switch for boolean settings and preferences.",
    render: () => (
      <div className="flex flex-col gap-5 w-72">
        {[
          { label: "Email Notifications", checked: true },
          { label: "Outbid Alerts", checked: true },
          { label: "Auction Reminders", checked: false },
          { label: "Newsletter", checked: false },
        ].map(({ label, checked }) => (
          <div key={label} className="flex items-center justify-between">
            <Label className="font-mono text-sm">{label}</Label>
            <Switch defaultChecked={checked} />
          </div>
        ))}
      </div>
    ),
  },
};

// ── Component Index page shown when no name is given ─────────────────────────
function PreviewIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Component Library</h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            Vehicle Sale Hub — {Object.keys(PREVIEWS).length} components available
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PREVIEWS).map(([name, { title, description }]) => (
            <a
              key={name}
              href={`/preview/${name}`}
              className="block group"
            >
              <Card className="h-full hover:border-primary/50 transition-colors duration-200 cursor-pointer group-hover:shadow-[0_0_15px_rgba(255,20,71,0.1)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display uppercase tracking-wide group-hover:text-primary transition-colors">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono">{description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                    /preview/{name} →
                  </span>
                </CardFooter>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single Component Preview ──────────────────────────────────────────────────
function ComponentPreview({ name }: { name: string }) {
  const preview = PREVIEWS[name];

  if (!preview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/20 border border-destructive/50 rounded-sm flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-xl font-display uppercase tracking-tight">Component Not Found</h2>
          <p className="text-muted-foreground font-mono text-sm">
            No preview registered for <span className="text-primary font-bold">{name}</span>
          </p>
          <a href="/preview" className="inline-block text-xs font-mono uppercase tracking-widest text-primary hover:underline">
            ← Back to component index
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <a href="/preview" className="text-muted-foreground hover:text-foreground transition-colors">
            <Car className="w-4 h-4" />
          </a>
          <span className="text-muted-foreground font-mono text-xs">/</span>
          <span className="font-mono text-sm font-bold">{preview.title}</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-2 py-0.5">
          preview
        </span>
      </div>

      {/* Component canvas */}
      <div className="flex items-center justify-center min-h-[calc(100vh-53px)] p-8">
        <div className="flex flex-col items-center gap-6">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {preview.description}
          </p>
          <preview.render />
        </div>
      </div>
    </div>
  );
}

// ── Query client for isolated preview context ─────────────────────────────────
const previewQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

// ── Main export ───────────────────────────────────────────────────────────────
export default function PreviewPage() {
  const params = useParams<{ component: string }>();
  const componentName = params.component;

  return (
    <QueryClientProvider client={previewQueryClient}>
      <TooltipProvider>
        {componentName ? (
          <ComponentPreview name={componentName} />
        ) : (
          <PreviewIndex />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
