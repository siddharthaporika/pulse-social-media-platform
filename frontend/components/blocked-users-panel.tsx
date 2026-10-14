"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldOff, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type BlockedUser = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  blockedAt?: string;
};

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function buildAuthHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function BlockedUsersPanel() {
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBlocked() {
      try {
        const res = await fetch(`${API}/users/me/blocked`, {
          headers: buildAuthHeaders(),
        });
        if (!res.ok) {
          if (!cancelled) setItems([]);
          return;
        }
        const data = await res.json();
        const arr: BlockedUser[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];
        if (!cancelled) setItems(arr);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (getToken()) {
      loadBlocked();
    } else {
      setLoading(false);
      setItems([]);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnblock(id: string) {
    try {
      await fetch(`${API}/users/${id}/block`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });
      setItems((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("unblock failed:", err);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ShieldOff className="h-5 w-5 text-muted-foreground" />
          <div className="font-semibold">Blocked users</div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <ShieldOff className="h-5 w-5 text-muted-foreground" />
        <div className="font-semibold">Blocked users</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t blocked anyone.
          </p>
        ) : (
          items.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>
                    {u.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <Link
                    href={`/user/${u.username}`}
                    className="font-medium hover:underline"
                  >
                    {u.username}
                  </Link>
                  {u.blockedAt && (
                    <div className="text-xs text-muted-foreground">
                      Blocked on{" "}
                      {new Date(u.blockedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => handleUnblock(u.id)}
              >
                <X className="h-4 w-4" />
                Unblock
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default BlockedUsersPanel;
