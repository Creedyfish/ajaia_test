import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = ["alice", "bob", "carol"];
  for (const name of users) {
    await prisma.user.upsert({
      where: { email: `${name}@ajaia.test` },
      update: {},
      create: {
        name,
        email: `${name}@ajaia.test`,
        password: await bcrypt.hash("password123", 10),
      },
    });
  }
  console.log("Seeded alice, bob, carol");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
