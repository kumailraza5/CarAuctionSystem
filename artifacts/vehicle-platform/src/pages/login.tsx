import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      login(response.user, response.token);
      toast({
        title: "Access Granted",
        description: `Welcome back, ${response.user.name}.`,
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error.response?.data?.error || "Invalid credentials. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <Card className="w-full max-w-md relative z-10 border-border bg-card/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,20,71,0.5)]">
              <Gavel className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-display uppercase tracking-tight">System Login</CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Authenticate to access the auction network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono uppercase text-xs tracking-wider">Email Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="operator@apex.auto" {...field} className="font-mono bg-secondary/50 border-border h-12" data-testid="input-email" />
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono uppercase text-xs tracking-wider">Security Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="font-mono bg-secondary/50 border-border h-12" data-testid="input-password" />
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 font-display uppercase font-bold tracking-widest text-sm shadow-[0_0_15px_rgba(255,20,71,0.3)] hover:shadow-[0_0_25px_rgba(255,20,71,0.6)] transition-all" 
                disabled={loginMutation.isPending}
                data-testid="btn-login"
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                ) : (
                  "Initiate Session"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/50 pt-6">
          <p className="text-sm text-muted-foreground font-mono">
            Unregistered operator?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-bold uppercase tracking-wider underline underline-offset-4" data-testid="link-to-register">
              Request Access
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
