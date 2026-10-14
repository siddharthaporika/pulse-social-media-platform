import PostTextCreator from "@/components/post-text-creator";
import { Navigation } from "@/components/navigation";

export default function TextCreatePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">Create</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Write a post</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Share an update, a thought, or something you have learned.</p>
        </div>
        <PostTextCreator />
      </main>
    </div>
  );
}
