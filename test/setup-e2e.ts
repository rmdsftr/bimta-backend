import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || "postgresql://postgres:behelhijau@localhost:5432/bimta?schema=public",
    },
  },
});

export async function SetupTestDB() {
  await prisma.jadwal.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.bimbingan.deleteMany();
  await prisma.jadwal_dosen.deleteMany();
  await prisma.users.deleteMany();
  
  await prisma.users.create({
    data: { 
      user_id: '2211522023', 
      nama: 'talita zulfa amira',
      no_whatsapp: '081234567890',
      sandi: 'hashedpassword123', 
      role: 'mahasiswa',
      status_user: 'active',
    },
  });
  
  await prisma.users.create({
    data: { 
      user_id: '0909090909', 
      nama: 'husnil kamil, MT',
      no_whatsapp: '081234567891',
      sandi: 'hashedpassword456',
      role: 'dosen',
      status_user: 'active',
    },
  });
  
  await prisma.bimbingan.create({
    data: {
      bimbingan_id: 'B1',
      mahasiswa_id: '2211522023',
      dosen_id: '0909090909',
      status_bimbingan: 'ongoing',
      total_bimbingan: 0,
    },
  });
}

export async function teardownTestDB() {
  await prisma.$disconnect();
}