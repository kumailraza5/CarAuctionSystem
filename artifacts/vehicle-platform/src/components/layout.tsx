import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CarFront, Gavel, Bell, User as UserIcon, LogOut, Menu, X, LayoutDashboard, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout: localLogout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
    } finally {
      localLogout();
    }
  };

  const navItems = [
    { label: "Vehicles", href: "/vehicles", icon: CarFront },
    { label: "Auctions", href: "/auctions", icon: Gavel },
  ];

  if (user) {
    navItems.push({ label: "My Purchases", href: "/purchases", icon: ShoppingBag });
    if (user.role === "admin") {
      navItems.push({ label: "Admin Panel", href: "/admin", icon: LayoutDashboard });
    } else if (user.role === "seller") {
      navItems.push(
        { label: "My Vehicles", href: "/seller/vehicles", icon: CarFront },
        { label: "My Auctions", href: "/seller/auctions", icon: Gavel }
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm">
                <Gavel className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block uppercase">
                APEX<span className="text-primary">AUTO</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === item.href || location.startsWith(item.href + "/") 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/notifications" className="text-muted-foreground hover:text-foreground transition-colors relative" data-testid="link-notifications">
                  <Bell className="w-5 h-5" />
                  {/* Notification badge could go here */}
                </Link>
                
                <div className="hidden sm:flex items-center gap-4 border-l border-border pl-4 ml-2">
                  <Link href="/profile" className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-medium" data-testid="link-profile">
                    <UserIcon className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive" data-testid="btn-logout">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Button variant="ghost" asChild className="font-medium font-mono uppercase text-xs tracking-wider">
                  <Link href="/login" data-testid="link-login">Login</Link>
                </Button>
                <Button asChild className="font-medium font-mono uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(255,20,71,0.5)] hover:shadow-[0_0_25px_rgba(255,20,71,0.8)] transition-all">
                  <Link href="/register" data-testid="link-register">Register</Link>
                </Button>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex flex-col gap-4">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex items-center gap-3 text-lg font-medium p-2 rounded-md hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 text-primary" />
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="h-px bg-border my-2" />
          
          {user ? (
            <div className="flex flex-col gap-4">
              <Link 
                href="/profile" 
                className="flex items-center gap-3 text-lg font-medium p-2 rounded-md hover:bg-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserIcon className="w-5 h-5 text-primary" />
                Profile
              </Link>
              <Button 
                variant="destructive" 
                className="justify-start gap-3 w-full"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-border mt-auto bg-card">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary flex items-center justify-center rounded-sm">
                  <Gavel className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight uppercase">
                  APEX<span className="text-primary">AUTO</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm">
                The premier digital auction house for high-performance and luxury vehicles. 
                Precision engineering meets high-stakes bidding.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold uppercase text-sm mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/vehicles" className="hover:text-primary transition-colors">Browse Vehicles</Link></li>
                <li><Link href="/auctions" className="hover:text-primary transition-colors">Active Auctions</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Become a Seller</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold uppercase text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Auction Rules</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} APEX AUTO AUCTIONS. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
