"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, registerSchema } from "@/lib/validators";

type Mode = "login" | "register";
type AuthValues = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  area?: string;
  phoneVisible?: boolean;
};

const googleErrors: Record<string, string> = {
  google_not_configured: "Google sign-in has not been configured yet.",
  google_invalid_request: "The Google sign-in request expired or was invalid. Please try again.",
  google_account_conflict: "That email is already linked to a different Google account.",
  google_failed: "Google sign-in failed. Please try again."
};

export function AuthForm({ mode, oauthError }: { mode: Mode; oauthError?: string }) {
  const [error, setError] = useState("");
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AuthValues>,
    defaultValues:
      mode === "login"
        ? { email: "", password: "" }
        : { email: "", password: "", name: "", phone: "", area: "", phoneVisible: false }
  });

  async function onSubmit(values: AuthValues) {
    setError("");
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Something went wrong.");
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <Card className="w-full max-w-md border-0 bg-transparent shadow-none hover:translate-y-0 hover:shadow-none">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Sign in" : "Create your account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Use your EGF Connect account to continue."
            : "Register as a member of the fellowship."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline" type="button" onClick={() => window.location.assign("/api/auth/google")}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 5.9Z" />
          </svg>
          Continue with Google
        </Button>
        {oauthError && googleErrors[oauthError] && (
          <p className="mt-4 text-sm text-destructive">{googleErrors[oauthError]}</p>
        )}
        <div className="my-4 flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {mode === "register" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Area</Label>
                <Input id="area" {...form.register("area")} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("phoneVisible")} />
                Show my phone number in the member directory
              </label>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          {mode === "login" ? "Need an account? " : "Already have an account? "}
          <Link className="font-medium text-primary" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Register" : "Sign in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
