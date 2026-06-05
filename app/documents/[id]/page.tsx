"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Editor from "@/components/Editor";
import { use } from "react";
import ShareModal from "@/components/ShareModal";
type DocData = {
  id: string;
  title: string;
  content: object;
  ownerId: string;
  accessRole: "OWNER" | "EDITOR" | "VIEWER";
  owner: { id: string; name: string | null; email: string };
  shares: {
    user: { id: string; name: string | null; email: string };
    role: "VIEWER" | "EDITOR";
  }[];
};

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDoc();
  }, [status, id]);

  async function fetchDoc() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (res.status === 404 || res.status === 403) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      const data: DocData = await res.json();
      setDoc(data);
      setTitle(data.title);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => saveTitle(value), 1000);
  }

  async function saveTitle(value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === doc?.title) return;
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    setDoc((prev) => (prev ? { ...prev, title: trimmed } : prev));
  }

  function handleTitleBlur() {
    setEditingTitle(false);
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    saveTitle(title);
  }

  const canEdit = doc?.accessRole === "OWNER" || doc?.accessRole === "EDITOR";

  if (status === "loading" || (loading && !notFound)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center px-4">
        <Lock className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-semibold">Document not found</p>
        <p className="text-sm text-muted-foreground">
          It may have been deleted or you don&apos;t have access.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20 px-4 h-14 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Inline title edit */}
        {canEdit && editingTitle ? (
          <Input
            ref={titleInputRef}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") titleInputRef.current?.blur();
            }}
            className="h-8 text-sm font-medium max-w-sm border-0 border-b rounded-none focus-visible:ring-0 px-0"
            maxLength={255}
          />
        ) : (
          <span
            className={`text-sm font-medium truncate max-w-sm ${
              canEdit
                ? "cursor-pointer hover:text-primary transition-colors"
                : ""
            }`}
            onClick={() => {
              if (!canEdit) return;
              setEditingTitle(true);
              setTimeout(() => titleInputRef.current?.focus(), 0);
            }}
          >
            {title}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Share button — only owner can share */}
          {doc.accessRole === "OWNER" && (
            <ShareModal docId={doc.id} initialShares={doc.shares ?? []} />
          )}

          {doc.accessRole === "VIEWER" && (
            <Badge variant="outline" className="text-xs gap-1">
              <Lock className="h-3 w-3" />
              View only
            </Badge>
          )}
          {doc.accessRole !== "OWNER" && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Owned by {doc.owner.name ?? doc.owner.email}
            </span>
          )}
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-auto min-h-0">
        <Editor
          documentId={doc.id}
          initialContent={
            doc.content && Object.keys(doc.content).length > 0
              ? doc.content
              : { type: "doc", content: [{ type: "paragraph" }] }
          }
          readOnly={!canEdit}
        />
      </div>
    </div>
  );
}
