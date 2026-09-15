import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  for (const mode of ['singles', 'doubles']) {
    await prisma.tournament.upsert({
      where: { mode },
      create: { mode, playersList: [], bracketData: [], matchDetails: [] },
      update: {},
    });
    console.log(`✓ ensured row: ${mode}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});