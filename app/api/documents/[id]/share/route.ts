import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/share
// Body: { email: string, role: "VIEWER" | "EDITOR" }
// Only the document owner can share
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Confirm requester is the owner
  const document = await prisma.document.findUnique({
    where: { id: id },
    select: { ownerId: true, title: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (document.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the document owner can share" },
      { status: 403 },
    );
  }

  let body: { email?: string; role?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.toString().trim().toLowerCase();
  const role = body.role?.toString().toUpperCase();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 422 });
  }
  if (role !== "VIEWER" && role !== "EDITOR") {
    return NextResponse.json(
      { error: "role must be VIEWER or EDITOR" },
      { status: 422 },
    );
  }

  // Resolve target user
  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!target) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 },
    );
  }
  if (target.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot share a document with yourself" },
      { status: 422 },
    );
  }

  // Upsert so re-sharing just updates the role
  const share = await prisma.docShare.upsert({
    where: { docId_userId: { docId: id, userId: target.id } },
    create: {
      docId: id,
      userId: target.id,
      role: role as "VIEWER" | "EDITOR",
    },
    update: { role: role as "VIEWER" | "EDITOR" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(share, { status: 201 });
}

// DELETE /api/documents/[id]/share
// Body: { userId: string }
// Owner can revoke any share; a shared user can remove themselves
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetUserId = body.userId?.toString();
  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 422 });
  }

  const document = await prisma.document.findUnique({
    where: { id: id },
    select: { ownerId: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const isOwner = document.ownerId === session.user.id;
  const isSelf = targetUserId === session.user.id;

  if (!isOwner && !isSelf) {
    return NextResponse.json(
      { error: "Not authorized to revoke this share" },
      { status: 403 },
    );
  }

  await prisma.docShare.deleteMany({
    where: { docId: id, userId: targetUserId },
  });

  return new NextResponse(null, { status: 204 });
}
