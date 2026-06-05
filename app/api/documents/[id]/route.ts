import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// Helper: resolve the current user's access level for a document.
// Returns "OWNER" | "EDITOR" | "VIEWER" | null
async function getAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { ownerId: true },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return "OWNER";

  const share = await prisma.docShare.findUnique({
    where: { docId_userId: { docId, userId } },
    select: { role: true },
  });

  return share?.role ?? null;
}

// GET /api/documents/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccess(id, session.user.id);
  if (!access) {
    return NextResponse.json(
      { error: "Not found or access denied" },
      { status: 404 },
    );
  }

  const document = await prisma.document.findUnique({
    where: { id: id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ ...document, accessRole: access });
}

// PATCH /api/documents/[id]
// Owners and EDITORs can update title/content
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccess(id, session.user.id);
  if (!access || access === "VIEWER") {
    return NextResponse.json(
      { error: "Not found or insufficient permissions" },
      { status: 403 },
    );
  }

  let body: { title?: string; content?: object } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { title?: string; content?: object } = {};
  if (body.title !== undefined) {
    const trimmed = body.title.toString().trim().slice(0, 255);
    if (!trimmed) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 422 },
      );
    }
    data.title = trimmed;
  }
  if (body.content !== undefined) {
    data.content = body.content;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No updatable fields provided" },
      { status: 422 },
    );
  }

  const updated = await prisma.document.update({
    where: { id: id },
    data,
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/documents/[id]
// Owner only
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccess(id, session.user.id);
  if (access !== "OWNER") {
    return NextResponse.json(
      { error: "Only the owner can delete this document" },
      { status: 403 },
    );
  }

  // Cascade: DocShare rows are deleted automatically if you have onDelete: Cascade in schema.
  // If not, delete shares manually first.
  await prisma.docShare.deleteMany({ where: { docId: id } });
  await prisma.document.delete({ where: { id: id } });

  return new NextResponse(null, { status: 204 });
}
