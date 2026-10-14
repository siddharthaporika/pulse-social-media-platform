"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LoaderCircle, Send } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const MAX_LENGTH = 2000;

export default function PostTextCreator() {
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handlePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = caption.trim();
    if (!content) {
      toast({ title: "Write something first", description: "Your post cannot be empty.", variant: "destructive" });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Sign in required", description: "Please sign in before publishing a post.", variant: "destructive" });
      router.push("/login");
      return;
    }

    setPosting(true);
    try {
      const response = await fetch(`${API}/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: content, mediaUrl: null, postType: "TEXT" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Your post could not be published.");
      toast({ title: "Post published", description: "Your update is now part of the Pulse community." });
      router.push(`/profile?post=${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch (error) {
      toast({ title: "Publishing failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-secondary/30 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><FileText className="h-5 w-5" /></div><div><CardTitle className="text-lg">Start a conversation</CardTitle><p className="mt-1 text-sm text-muted-foreground">Keep it real. Your words can make someone’s day.</p></div></div></CardHeader>
      <form onSubmit={handlePost}>
        <CardContent className="p-4 sm:p-6"><Textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, MAX_LENGTH))} placeholder="What’s on your mind?" rows={8} className="resize-y rounded-2xl border-border/70 bg-background text-base leading-7 focus-visible:ring-2" aria-label="Post text" /><div className="mt-2 flex justify-end text-xs text-muted-foreground">{caption.length}/{MAX_LENGTH}</div></CardContent>
        <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-xs leading-5 text-muted-foreground">Be thoughtful and respectful of your community.</p><Button type="submit" disabled={posting || !caption.trim()} className="w-full rounded-xl sm:w-auto">{posting ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> Publishing…</> : <><Send className="mr-2 h-4 w-4"/> Publish post</>}</Button></CardFooter>
      </form>
    </Card>
  );
}
