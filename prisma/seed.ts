import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// The catalogue is seller-listed only. Running this removes any legacy
// house-catalogue rows (products with no seller) and their dials and straps.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const removed = await prisma.product.deleteMany({
    where: { sellerId: null },
  });

  const count = await prisma.product.count();
  console.log(
    `Removed ${removed.count} legacy house-catalogue products. ${count} seller listings remain.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
