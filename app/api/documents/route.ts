import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/documents
// Returns all documents owned by or shared with the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
      },
    }),
    prisma.docShare.findMany({
      where: { userId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            ownerId: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ]);

  return NextResponse.json({
    owned,
    shared: shared.map((s) => ({
      ...s.document,
      role: s.role,
    })),
  });
}

// POST /api/documents
// Create a new document
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; content?: object } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine; we'll use defaults
  }

  const title =
    (body.title ?? "Untitled Document").toString().trim().slice(0, 255) ||
    "Untitled Document";
  const content = body.content ?? { type: "doc", content: [] };

  const document = await prisma.document.create({
    data: {
      title,
      content,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
