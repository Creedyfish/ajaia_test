// components/ShareModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, X, Loader2 } from "lucide-react";

type ShareUser = {
  id: string;
  name: string | null;
  email: string;
};

type Share = {
  user: ShareUser;
  role: "VIEWER" | "EDITOR";
};

type Props = {
  docId: string;
  initialShares: Share[];
};

export default function ShareModal({ docId, initialShares }: Props) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>(initialShares);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleShare() {
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Upsert in local state
      setShares((prev) => {
        const exists = prev.findIndex((s) => s.user.id === data.user.id);
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = { user: data.user, role: data.role };
          return next;
        }
        return [...prev, { user: data.user, role: data.role }];
      });
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId: string) {
    setRevoking(userId);
    try {
      await fetch(`/api/documents/${docId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setShares((prev) => prev.filter((s) => s.user.id !== userId));
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
        </DialogHeader>

        {/* Add share row */}
        <div className="flex gap-2">
          <Input
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleShare()}
            className="flex-1"
          />
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "VIEWER" | "EDITOR")}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEWER">Viewer</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleShare} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Current shares list */}
        {shares.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              People with access
            </p>
            {shares.map((s) => (
              <div
                key={s.user.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {s.user.name ?? s.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-xs text-muted-foreground capitalize">
                    {s.role.toLowerCase()}
                  </span>
                  <button
                    onClick={() => handleRevoke(s.user.id)}
                    disabled={revoking === s.user.id}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Revoke access"
                  >
                    {revoking === s.user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
