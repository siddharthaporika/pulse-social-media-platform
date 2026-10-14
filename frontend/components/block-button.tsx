"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function BlockButton({
  targetId,
  disabled,
  onToggle,
}: {
  targetId: string;
  disabled?: boolean;
  onToggle?: (blocked: boolean) => void;
}) {
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await fetch(`${API}/users/me/blocked`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        const j = r.ok ? await r.json() : [];
        if (!off) {
          const isBlocked = Array.isArray(j) && j.some((u: any) => u.id === targetId);
          setBlocked(isBlocked);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      off = true;
    };
  }, [targetId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (blocked) {
        await fetch(`${API}/users/${targetId}/block`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        setBlocked(false);
        onToggle?.(false);
      } else {
        await fetch(`${API}/users/${targetId}/block`, {
          method: "POST",
          headers: authHeaders(),
        });
        setBlocked(true);
        onToggle?.(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={blocked ? "outline" : "destructive"}
      size="sm"
      onClick={toggle}
      disabled={disabled || busy}
    >
      {blocked ? "Unblock" : "Block"}
    </Button>
  );
}
