"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "duqral7bw";
const IMAGE_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_UPLOAD_PRESET || "unsigned_post_upload";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type SelectedMedia = { file: File; previewUrl: string; isImage: boolean };

export default function PostMediaCreator() {
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => () => { if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl); }, [media]);

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({ title: "Unsupported file", description: "Choose an image or video file.", variant: "destructive" });
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File is too large", description: "Choose a file smaller than 50 MB.", variant: "destructive" });
      event.target.value = "";
      return;
    }
    setMedia({ file, previewUrl: URL.createObjectURL(file), isImage: file.type.startsWith("image/") });
  }

  async function handlePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!media) {
      toast({ title: "Choose a file first", description: "Select an image or video to publish.", variant: "destructive" });
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
      const uploadData = new FormData();
      uploadData.append("file", media.file);
      uploadData.append("upload_preset", IMAGE_PRESET);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: "POST", body: uploadData });
      const uploaded = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploaded.secure_url) throw new Error(uploaded.error?.message || "Media upload failed. Check your Cloudinary settings.");

      const response = await fetch(`${API}/posts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: caption.trim(), mediaUrl: uploaded.secure_url, postType: media.isImage ? "IMAGE" : "VIDEO" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Your post could not be saved.");
      toast({ title: "Post published", description: "Your media is now part of the Pulse community." });
      router.push(`/profile?post=${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-secondary/30 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><ImagePlus className="h-5 w-5"/></div><div><CardTitle className="text-lg">Add photo or video</CardTitle><p className="mt-1 text-sm text-muted-foreground">Bring your moment to life with a caption.</p></div></div></CardHeader>
      <form onSubmit={handlePost}>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="space-y-2"><Label htmlFor="media-file">Media file</Label><Input id="media-file" type="file" accept="image/*,video/*" onChange={chooseFile} disabled={posting} className="h-auto rounded-xl py-3 file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"/><p className="text-xs text-muted-foreground">Images and videos up to 50 MB.</p></div>
          {media ? <div className="overflow-hidden rounded-2xl border bg-black/[0.03]"><div className="flex items-center justify-between border-b bg-card px-3 py-2"><span className="truncate pr-3 text-sm font-medium">{media.file.name}</span><Button type="button" variant="ghost" size="icon" aria-label="Remove selected media" onClick={() => { setMedia(null); }} disabled={posting}><X className="h-4 w-4"/></Button></div>{media.isImage ? <img src={media.previewUrl} alt="Selected upload preview" className="mx-auto max-h-[420px] w-full object-contain"/> : <video src={media.previewUrl} controls className="mx-auto max-h-[420px] w-full"/>}</div> : <label htmlFor="media-file" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 px-6 py-12 text-center transition hover:bg-secondary/40"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-background shadow-sm"><Upload className="h-6 w-6 text-muted-foreground"/></span><span className="mt-4 font-semibold">Choose a file to preview</span><span className="mt-1 text-sm text-muted-foreground">PNG, JPG, GIF, MP4 and other supported formats</span></label>}
          <div className="space-y-2"><Label htmlFor="media-caption">Caption <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="media-caption" value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 2000))} rows={3} placeholder="Add a little context…" className="resize-y rounded-xl"/><p className="text-right text-xs text-muted-foreground">{caption.length}/2000</p></div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-xs leading-5 text-muted-foreground">Uploads use your configured Cloudinary unsigned preset.</p><Button type="submit" disabled={posting || !media} className="w-full rounded-xl sm:w-auto">{posting ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> Publishing…</> : <><ImagePlus className="mr-2 h-4 w-4"/> Publish media</>}</Button></CardFooter>
      </form>
    </Card>
  );
}
