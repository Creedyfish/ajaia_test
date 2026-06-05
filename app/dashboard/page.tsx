"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Plus,
  LogOut,
  Users,
  Crown,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UploadDocButton from "@/components/UploadDocButton";

type OwnedDoc = {
  id: string;
  title: string;
  updatedAt: string;
  ownerId: string;
};

type SharedDoc = OwnedDoc & {
  role: "VIEWER" | "EDITOR";
  owner: { name: string | null; email: string };
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [owned, setOwned] = useState<OwnedDoc[]>([]);
  const [shared, setShared] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDocs();
  }, [status]);

  async function fetchDocs() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOwned(data.owned);
      setShared(data.shared);
    } catch {
      // silently fail; empty state handles it
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const doc = await res.json();
      router.push(`/documents/${doc.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setOwned((prev) => prev.filter((d) => d.id !== id));
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">
              Ajaia Docs
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <div className="flex items-center gap-2">
            <UploadDocButton
              onUploaded={(id) => router.push(`/documents/${id}`)}
            />
            <Button onClick={handleCreate} disabled={creating} size="sm">
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Document
            </Button>
          </div>
        </div>

        <Tabs defaultValue="owned">
          <TabsList className="mb-4">
            <TabsTrigger value="owned" className="gap-2">
              <Crown className="h-3.5 w-3.5" />
              My Documents
              {!loading && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {owned.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2">
              <Users className="h-3.5 w-3.5" />
              Shared with Me
              {!loading && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {shared.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            {loading ? (
              <DocSkeletons />
            ) : owned.length === 0 ? (
              <EmptyState
                icon={<Crown className="h-8 w-8 text-muted-foreground" />}
                title="No documents yet"
                description="Create your first document to get started."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {owned.map((doc) => (
                  <DocCard
                    key={doc.id}
                    id={doc.id}
                    title={doc.title}
                    updatedAt={doc.updatedAt}
                    onOpen={() => router.push(`/documents/${doc.id}`)}
                    onDelete={() => handleDelete(doc.id)}
                    showDelete
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared">
            {loading ? (
              <DocSkeletons />
            ) : shared.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8 text-muted-foreground" />}
                title="Nothing shared with you"
                description="When someone shares a document with you, it will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {shared.map((doc) => (
                  <DocCard
                    key={doc.id}
                    id={doc.id}
                    title={doc.title}
                    updatedAt={doc.updatedAt}
                    onOpen={() => router.push(`/documents/${doc.id}`)}
                    badge={doc.role}
                    subtitle={`Shared by ${doc.owner.name ?? doc.owner.email}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DocCard({
  id,
  title,
  updatedAt,
  onOpen,
  onDelete,
  showDelete,
  badge,
  subtitle,
}: {
  id: string;
  title: string;
  updatedAt: string;
  onOpen: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  badge?: string;
  subtitle?: string;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors group"
      onClick={onOpen}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2 leading-snug">
            {title}
          </CardTitle>
          {showDelete && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete document?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{title}&quot; and all its
                    shares. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {badge && (
            <Badge variant="outline" className="text-xs shrink-0">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <CardDescription className="text-xs mt-0.5">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-xs text-muted-foreground">
          Edited {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon}
      <p className="font-medium text-sm">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function DocSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2 pt-4 px-4">
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
