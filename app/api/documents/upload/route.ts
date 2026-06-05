// app/api/documents/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import mammoth from "mammoth";

// Converts plain text (or markdown) into a minimal TipTap doc JSON
function textToTipTap(text: string) {
  const paragraphs = text.split(/\r?\n/).map((line) => ({
    type: "paragraph",
    content: line.trim() ? [{ type: "text", text: line }] : [],
  }));
  return { type: "doc", content: paragraphs };
}

// Converts mammoth HTML output into a minimal TipTap doc JSON.
// We keep it simple: strip tags, split on <p>/<br>, preserve bold/italic
// via marks. For a full mapping you'd use a proper HTML -> ProseMirror parser.
function htmlToTipTap(html: string) {
  // Split on block-level boundaries
  const blocks = html
    .replace(/<\/?(h[1-6]|p|li|div|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "") // strip remaining tags
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const content = blocks.map((text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  }));

  return { type: "doc", content: content.length ? content : [] };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 422 });
  }

  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase();

  if (!["txt", "md", "docx"].includes(ext ?? "")) {
    return NextResponse.json(
      { error: "Unsupported file type. Accepted: .txt, .md, .docx" },
      { status: 422 },
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 5 MB" },
      { status: 422 },
    );
  }

  let content: object;
  const titleBase =
    name
      .replace(/\.[^.]+$/, "")
      .trim()
      .slice(0, 200) || "Uploaded Document";

  if (ext === "txt" || ext === "md") {
    const text = await file.text();
    content = textToTipTap(text);
  } else {
    // docx
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml({ buffer });
    content = htmlToTipTap(result.value);
  }

  const document = await prisma.document.create({
    data: {
      title: titleBase,
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
