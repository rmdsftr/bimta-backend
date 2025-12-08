import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import request from 'supertest';

describe('KEGIATAN system testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const dosenId = 'D100';
  const mahasiswaId = '2211522023';
  const bimbinganId = 'B100';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clear DB
    await prisma.progress.deleteMany();
    await prisma.jadwal.deleteMany();
    await prisma.jadwal_dosen.deleteMany();
    await prisma.bimbingan.deleteMany();
    await prisma.users.deleteMany();

    // Users
    await prisma.users.createMany({
      data: [
        {
          user_id: dosenId,
          nama: 'Saputra Test',
          no_whatsapp: '0811111111',
          sandi: 'hashed',
          role: 'dosen',
          status_user: 'active',
        },
        {
          user_id: mahasiswaId,
          nama: 'Talitha',
          no_whatsapp: '0822222222',
          sandi: 'hashed',
          role: 'mahasiswa',
          status_user: 'active',
        },
      ],
      skipDuplicates: true,
    });

    // Bimbingan
    await prisma.bimbingan.create({
      data: {
        bimbingan_id: bimbinganId,
        dosen_id: dosenId,
        mahasiswa_id: mahasiswaId,
        status_bimbingan: 'ongoing',
        total_bimbingan: 0,
      },
    });
  });

  describe('POST /kegiatan/add/:dosen_id', () => {
    it('should create kegiatan successfully', async () => {
      const dto = {
        kegiatan: 'Rapat Koordinasi',
        tanggal: '2025-12-10',
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const res = await request(app.getHttpServer())
        .post(`/kegiatan/add/${dosenId}`)
        .send(dto)
        .expect(201);

      expect(res.body).toHaveProperty('jadwal_dosen_id');
      expect(res.body).toHaveProperty('dosen_id', dosenId);
      expect(res.body).toHaveProperty('kegiatan', dto.kegiatan);
    });

    it('should fail validation if missing fields', async () => {
      const dto = { kegiatan: '', tanggal: '', jam_mulai: '', jam_selesai: '' };
      const res = await request(app.getHttpServer())
        .post(`/kegiatan/add/${dosenId}`)
        .send(dto)
        .expect(400);

      expect(res.body.message.length).toBeGreaterThan(0);
    });

    it('should fail for invalid date format', async () => {
      const dto = {
        kegiatan: 'Test Invalid Date',
        tanggal: 'invalid-date',
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };
      const res = await request(app.getHttpServer())
        .post(`/kegiatan/add/${dosenId}`)
        .send(dto)
        .expect(400);

      expect(res.body.message).toContain('tanggal must be a valid ISO 8601 date string');
    });
  });

  describe('GET /kegiatan/dosen/:dosen_id', () => {
    it('should get kegiatan by month', async () => {
      const jadwalId = 'JD100';
      await prisma.jadwal_dosen.create({
        data: {
          jadwal_dosen_id: jadwalId,
          dosen_id: dosenId,
          tanggal: new Date('2025-12-10'),
          kegiatan: 'Rapat Koordinasi',
          jam_mulai: new Date('1970-01-01T08:00:00Z'),
          jam_selesai: new Date('1970-01-01T10:00:00Z'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/kegiatan/dosen/${dosenId}?year=2025&month=12`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('kegiatan', 'Rapat Koordinasi');
    });

    it('should return empty array if no kegiatan in month', async () => {
      const res = await request(app.getHttpServer())
        .get(`/kegiatan/dosen/${dosenId}?year=2025&month=11`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /kegiatan/dosen/:dosen_id/date/:date', () => {
    it('should get kegiatan by exact date', async () => {
      const jadwalId = 'JD101';
      await prisma.jadwal_dosen.create({
        data: {
          jadwal_dosen_id: jadwalId,
          dosen_id: dosenId,
          tanggal: new Date('2025-12-15'),
          kegiatan: 'Meeting',
          jam_mulai: new Date('1970-01-01T09:00:00Z'),
          jam_selesai: new Date('1970-01-01T10:00:00Z'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/kegiatan/dosen/${dosenId}/date/2025-12-15`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('kegiatan', 'Meeting');
    });
  });

  describe('DELETE /kegiatan/:jadwal_dosen_id', () => {
    it('should delete kegiatan', async () => {
      const jadwalId = 'JD102';
      await prisma.jadwal_dosen.create({
        data: {
          jadwal_dosen_id: jadwalId,
          dosen_id: dosenId,
          tanggal: new Date('2025-12-20'),
          kegiatan: 'Hapus Kegiatan',
          jam_mulai: new Date('1970-01-01T08:00:00Z'),
          jam_selesai: new Date('1970-01-01T10:00:00Z'),
        },
      });

      const res = await request(app.getHttpServer())
        .delete(`/kegiatan/${jadwalId}`)
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Kegiatan berhasil dihapus');
    });

    it('should fail when deleting non-existent kegiatan', async () => {
      const res = await request(app.getHttpServer())
        .delete('/kegiatan/FAKE_ID')
        .expect(404);

      expect(res.body.message).toContain('Kegiatan tidak ditemukan');
    });
  });

  describe('GET /kegiatan/mahasiswa/:mahasiswa_id', () => {
    it('should get kegiatan for mahasiswa by month', async () => {
      const jadwalId = 'JD103';
      await prisma.jadwal_dosen.create({
        data: {
          jadwal_dosen_id: jadwalId,
          dosen_id: dosenId,
          tanggal: new Date('2025-12-25'),
          kegiatan: 'Bimbingan Mahasiswa',
          jam_mulai: new Date('1970-01-01T10:00:00Z'),
          jam_selesai: new Date('1970-01-01T12:00:00Z'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/kegiatan/mahasiswa/${mahasiswaId}?year=2025&month=12`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('kegiatan', 'Bimbingan Mahasiswa');
    });

    it('should get kegiatan for mahasiswa by date', async () => {
      const jadwalId = 'JD104';
      await prisma.jadwal_dosen.create({
        data: {
          jadwal_dosen_id: jadwalId,
          dosen_id: dosenId,
          tanggal: new Date('2025-12-26'),
          kegiatan: 'Bimbingan Selesai',
          jam_mulai: new Date('1970-01-01T11:00:00Z'),
          jam_selesai: new Date('1970-01-01T12:00:00Z'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/kegiatan/mahasiswa/${mahasiswaId}/date/2025-12-26`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('kegiatan', 'Bimbingan Selesai');
    });
  });
});
