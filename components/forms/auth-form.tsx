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

export function AuthForm({ mode }: { mode: Mode }) {
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Sign in" : "Create your account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Use your EGF Connect account to continue."
            : "Register as a member of the fellowship."}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
