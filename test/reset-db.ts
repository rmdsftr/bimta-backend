import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.jadwal.deleteMany();
  await prisma.bimbingan.deleteMany();
  await prisma.users.deleteMany();
}

main().finally(() => prisma.$disconnect());
