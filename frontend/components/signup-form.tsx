"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LoaderCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    if (password.length < 8) { setIsError(true); setMessage("Use a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setIsError(true); setMessage("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), name: name.trim(), email: email.trim().toLowerCase(), password, accountType }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Account creation failed.");
      setMessage("Account created. Redirecting to sign in…");
      router.push("/login");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to connect to the server. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl md:min-h-[680px] md:grid-cols-2">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/30" />
      <div className="flex items-center justify-center p-5 sm:p-10">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="space-y-3 px-0"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><UserPlus className="h-6 w-6"/></div><CardTitle className="text-3xl font-bold tracking-tight">Join Pulse</CardTitle><CardDescription>Create your account and find your community.</CardDescription></CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Display name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" required className="h-11 rounded-xl"/></div><div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} autoComplete="username" placeholder="yourhandle" required className="h-11 rounded-xl"/></div></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required className="h-11 rounded-xl"/></div>
              <div className="space-y-2"><Label htmlFor="account-type">Account privacy</Label><Select value={accountType} onValueChange={(value) => setAccountType(value as "PUBLIC" | "PRIVATE")}><SelectTrigger id="account-type" className="h-11 rounded-xl"><SelectValue placeholder="Choose account privacy"/></SelectTrigger><SelectContent><SelectItem value="PUBLIC">Public — anyone can see posts</SelectItem><SelectItem value="PRIVATE">Private — approve followers</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required className="h-11 rounded-xl"/></div>
              <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" required className="h-11 rounded-xl"/></div>
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> Creating account…</> : "Create account"}</Button>
            </form>
            {message && <p role="status" className={`mt-4 text-sm ${isError ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
            <p className="mt-6 text-center text-sm text-muted-foreground">Already on Pulse? <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">Sign in</Link></p>
          </CardContent>
        </Card>
      </div>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-slate-950 p-10 text-white md:flex"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/20"/><div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full border border-white/15"/><div className="relative flex items-center gap-2 text-lg font-semibold"><Heart className="h-5 w-5" fill="currentColor"/> Pulse</div><div className="relative max-w-sm"><p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">A place to belong</p><h2 className="mt-4 text-4xl font-bold leading-tight">Your story deserves a space.</h2><p className="mt-4 text-sm leading-6 text-white/75">Share moments, discover new perspectives, and connect with people who get you.</p></div><p className="relative text-xs text-white/60">Start with a hello.</p></div>
    </div>
  );
}
