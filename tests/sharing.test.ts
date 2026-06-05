import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

let aliceId: string;
let bobId: string;
let carolId: string;
let docId: string;

beforeAll(async () => {
  const alice = await prisma.user.findUniqueOrThrow({
    where: { email: "alice@ajaia.test" },
  });
  const bob = await prisma.user.findUniqueOrThrow({
    where: { email: "bob@ajaia.test" },
  });
  const carol = await prisma.user.findUniqueOrThrow({
    where: { email: "carol@ajaia.test" },
  });

  aliceId = alice.id;
  bobId = bob.id;
  carolId = carol.id;

  const doc = await prisma.document.create({
    data: {
      title: "Test Doc",
      content: "<p>Hello</p>",
      ownerId: aliceId,
    },
  });
  docId = doc.id;

  await prisma.docShare.create({
    data: {
      docId: docId,
      userId: bobId,
      role: "VIEWER",
    },
  });
});

afterAll(async () => {
  await prisma.docShare.deleteMany({ where: { docId: docId } });
  await prisma.document.delete({ where: { id: docId } });
  await prisma.$disconnect();
});

describe("Document sharing access control", () => {
  it("bob can access the shared document", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    const bobHasAccess =
      doc?.ownerId === bobId || doc?.shares.some((s) => s.userId === bobId);

    expect(bobHasAccess).toBe(true);
  });

  it("carol cannot access the document", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    const carolHasAccess =
      doc?.ownerId === carolId || doc?.shares.some((s) => s.userId === carolId);

    expect(carolHasAccess).toBe(false);
  });

  it("bob's document list includes the shared doc", async () => {
    const sharedDocs = await prisma.document.findMany({
      where: { shares: { some: { userId: bobId } } },
    });

    expect(sharedDocs.map((d) => d.id)).toContain(docId);
  });
});
