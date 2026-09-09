import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Gavel, Loader2, ShieldAlert } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "seller"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "buyer",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await registerMutation.mutateAsync({ data: {
        ...data,
        role: data.role as RegisterBodyRole
      } });
      login(response.user, response.token);
      toast({
        title: "Registration Confirmed",
        description: `Welcome to the network, ${response.user.name}.`,
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.error || "Unable to create account.",
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <Card className="w-full max-w-md relative z-10 border-border bg-card/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,20,71,0.5)]">
              <ShieldAlert className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-display uppercase tracking-tight">System Registration</CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Request operator clearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono uppercase text-xs tracking-wider">Operator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="font-mono bg-secondary/50 border-border h-12" data-testid="input-name" />
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
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
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3 pt-2 pb-4">
                    <FormLabel className="font-mono uppercase text-xs tracking-wider">Operational Clearance</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        data-testid="radio-role"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 bg-secondary/30 p-3 rounded-sm border border-border">
                          <FormControl>
                            <RadioGroupItem value="buyer" className="text-primary" />
                          </FormControl>
                          <FormLabel className="font-mono font-normal uppercase text-sm cursor-pointer">Buyer (Standard Access)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 bg-secondary/30 p-3 rounded-sm border border-border">
                          <FormControl>
                            <RadioGroupItem value="seller" className="text-primary" />
                          </FormControl>
                          <FormLabel className="font-mono font-normal uppercase text-sm cursor-pointer">Seller (Asset Provider)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 font-display uppercase font-bold tracking-widest text-sm shadow-[0_0_15px_rgba(255,20,71,0.3)] hover:shadow-[0_0_25px_rgba(255,20,71,0.6)] transition-all mt-4" 
                disabled={registerMutation.isPending}
                data-testid="btn-register"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "Submit Registration"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/50 pt-6">
          <p className="text-sm text-muted-foreground font-mono">
            Already verified?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-bold uppercase tracking-wider underline underline-offset-4" data-testid="link-to-login">
              Authenticate Here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
