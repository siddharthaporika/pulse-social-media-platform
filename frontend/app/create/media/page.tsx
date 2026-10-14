import PostMediaCreator from "@/components/post-media-creator";
import { Navigation } from "@/components/navigation";

export default function MediaCreatePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">Create</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Share a moment</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Upload an image or video and add a caption for your community.</p>
        </div>
        <PostMediaCreator />
      </main>
    </div>
  );
}
