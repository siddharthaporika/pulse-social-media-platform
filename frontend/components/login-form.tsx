"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const isEmail = identifier.includes("@");
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [isEmail ? "email" : "username"]: identifier.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(data.message || "Sign in failed. Check your details and try again.");
      localStorage.setItem("token", data.token);
      setMessage("Signed in successfully. Redirecting…");
      router.push("/home");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl md:min-h-[640px] md:grid-cols-2">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/30" />
      <div className="flex items-center justify-center p-5 sm:p-10">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="space-y-3 px-0">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Heart className="h-6 w-6" fill="currentColor" /></div>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in to see what your community is sharing.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="identifier">Email or username</Label><Input id="identifier" autoComplete="username" placeholder="you@example.com or username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required className="h-11 rounded-xl" /></div>
              <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><LockKeyhole className="h-4 w-4 text-muted-foreground" /></div><Input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11 rounded-xl" /></div>
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}</Button>
            </form>
            {message && <p role="status" className={`mt-4 text-sm ${isError ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
            <p className="mt-6 text-center text-sm text-muted-foreground">New to Pulse? <Link href="/signup" className="font-semibold text-foreground underline underline-offset-4">Create an account</Link></p>
          </CardContent>
        </Card>
      </div>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-slate-950 p-10 text-white md:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/20" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full border border-white/15" />
        <div className="relative flex items-center gap-2 text-lg font-semibold"><Heart className="h-5 w-5" fill="currentColor" /> Pulse</div>
        <div className="relative max-w-sm"><p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">Stay connected</p><h2 className="mt-4 text-4xl font-bold leading-tight">Small moments make great stories.</h2><p className="mt-4 text-sm leading-6 text-white/75">Find your people, share what matters, and keep the conversation going.</p></div>
        <p className="relative text-xs text-white/60">Your community is waiting.</p>
      </div>
    </div>
  );
}
