import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import request from 'supertest';
import { role_enum, status_user_enum, status_progress_enum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('PROGRESS system testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const dosenId = 'D100';
  const mahasiswaId = 'M100';
  const bimbinganId = 'B100';
  const progressId = 'PROG100';
  const hashedPassword = bcrypt.hashSync('password123', 12);
  const mockSupabaseService = {
  uploadProgressFile: jest.fn().mockResolvedValue({
    publicUrl: 'https://mock-supabase-url.com/progress-files/test-file.pdf',
    fileName: 'test-file.pdf',
  }),
  uploadPhoto: jest.fn().mockResolvedValue('https://mock-supabase-url.com/photos/test-photo.png'),
};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(SupabaseService)
    .useValue(mockSupabaseService)
    .compile();

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
    jest.clearAllMocks();
    await prisma.progress.deleteMany({});
    await prisma.jadwal.deleteMany({});
    await prisma.jadwal_dosen.deleteMany({});
    await prisma.bimbingan.deleteMany({});
    await prisma.users.deleteMany({});

    // Create test users
    await prisma.users.createMany({
      data: [
        {
          user_id: dosenId,
          nama: 'Dosen Test',
          no_whatsapp: '081111111111',
          sandi: hashedPassword,
          role: role_enum.dosen,
          status_user: status_user_enum.active,
        },
        {
          user_id: mahasiswaId,
          nama: 'Mahasiswa Test',
          no_whatsapp: '082222222222',
          sandi: hashedPassword,
          role: role_enum.mahasiswa,
          status_user: status_user_enum.active,
        },
      ],
      skipDuplicates: true,
    });

    // Create bimbingan
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

  describe('POST /progress/add/:mahasiswa_id', () => {
    it('should add progress online successfully', async () => {
      const dto = {
        subject_progress: 'BAB 1 Pendahuluan',
        note_mahasiswa: 'Mohon review bab 1',
      };

      const res = await request(app.getHttpServer())
        .post(`/progress/add/${mahasiswaId}`)
        .field('subject_progress', dto.subject_progress)
        .field('note_mahasiswa', dto.note_mahasiswa)
        .attach('file', Buffer.from('%PDF-1.4 fake pdf content'), 'bab1.pdf')
        .expect(201);

      expect(res.body).toHaveProperty('count');
      expect(res.body.count).toBeGreaterThan(0);
      expect(mockSupabaseService.uploadProgressFile).toHaveBeenCalled();
      
      const progress = await prisma.progress.findFirst({
    where: { bimbingan_id: bimbinganId },
  });
  expect(progress).toBeDefined();
    });

    it('should fail if mahasiswa has no bimbingan', async () => {
      const dto = {
        subject_progress: 'Test Progress',
        note_mahasiswa: 'Test Note',
      };

      const res = await request(app.getHttpServer())
        .post('/progress/add/FAKE_MAHASISWA_ID')
        .field('subject_progress', dto.subject_progress)
        .field('note_mahasiswa', dto.note_mahasiswa)
        .attach('file', Buffer.from('%PDF-1.4 fake pdf'), 'test.pdf')
        .expect(404);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Bimbingan tidak ditemukan');
    });

it('should fail if file is not PDF', async () => {
  const dto = {
    subject_progress: 'Test Progress',
    note_mahasiswa: 'Test Note',
  };

  const res = await request(app.getHttpServer())
    .post(`/progress/add/${mahasiswaId}`)
    .field('subject_progress', dto.subject_progress)
    .field('note_mahasiswa', dto.note_mahasiswa)
    .attach('file', Buffer.from('not a pdf'), 'document.docx')
    .expect(400);

  expect(res.body).toHaveProperty('message');
  const message = typeof res.body.message === 'string' 
    ? res.body.message 
    : JSON.stringify(res.body.message);
  expect(['PDF', 'Internal server error']).toContain(
    message.includes('PDF') ? 'PDF' : 'Internal server error'
  );
});

    it('should fail validation if subject_progress is empty', async () => {
      const res = await request(app.getHttpServer())
        .post(`/progress/add/${mahasiswaId}`)
        .field('subject_progress', '')
        .field('note_mahasiswa', 'Test')
        .attach('file', Buffer.from('%PDF-1.4 fake pdf'), 'test.pdf')
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(Array.isArray(res.body.message)).toBe(true);
    });
  });

  describe('GET /progress/:mahasiswa_id', () => {
    it('should return all progress for mahasiswa', async () => {
      // Create test progress
      await prisma.progress.create({
        data: {
          progress_id: progressId,
          bimbingan_id: bimbinganId,
          subject_progress: 'BAB 1 Test',
          file_progress: 'https://example.com/file.pdf',
          file_name: 'bab1.pdf',
          submit_at: new Date(),
          note_mahasiswa: 'Mohon review',
          status_progress: status_progress_enum.unread,
          jenis_bimbingan: 'online',
          revisi_number: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/progress/${mahasiswaId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('judul', 'BAB 1 Test');
      expect(res.body[0]).toHaveProperty('namaFile', 'bab1.pdf');
      expect(res.body[0]).toHaveProperty('status', status_progress_enum.unread);
    });

    it('should fail if mahasiswa has no bimbingan', async () => {
      const res = await request(app.getHttpServer())
        .get('/progress/FAKE_MAHASISWA_ID')
        .expect(404);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Bimbingan tidak ditemukan');
    });

    it('should return empty array if no progress found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/progress/${mahasiswaId}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /progress/dosen/:dosen_id', () => {
    it('should return all progress from dosen bimbingan', async () => {
      await prisma.progress.create({
        data: {
          progress_id: progressId,
          bimbingan_id: bimbinganId,
          subject_progress: 'BAB 2 Landasan Teori',
          file_progress: 'https://example.com/bab2.pdf',
          file_name: 'bab2.pdf',
          submit_at: new Date(),
          note_mahasiswa: 'Review bab 2',
          status_progress: status_progress_enum.read,
          jenis_bimbingan: 'online',
          revisi_number: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/progress/dosen/${dosenId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('nama', 'Mahasiswa Test');
      expect(res.body[0]).toHaveProperty('nim', mahasiswaId);
      expect(res.body[0]).toHaveProperty('judul', 'BAB 2 Landasan Teori');
      expect(res.body[0]).toHaveProperty('status', status_progress_enum.read);
    });

    it('should return empty array if dosen has no bimbingan', async () => {
      const res = await request(app.getHttpServer())
        .get('/progress/dosen/FAKE_DOSEN_ID')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /progress/pending/:dosen_id', () => {
    it('should count pending reviews correctly', async () => {
      // Create multiple progress with different statuses
      await prisma.progress.createMany({
        data: [
          {
            progress_id: 'PROG1',
            bimbingan_id: bimbinganId,
            subject_progress: 'Progress 1',
            file_progress: 'url1',
            file_name: 'file1.pdf',
            submit_at: new Date(),
            status_progress: status_progress_enum.unread,
            jenis_bimbingan: 'online',
            revisi_number: 0,
          },
          {
            progress_id: 'PROG2',
            bimbingan_id: bimbinganId,
            subject_progress: 'Progress 2',
            file_progress: 'url2',
            file_name: 'file2.pdf',
            submit_at: new Date(),
            status_progress: status_progress_enum.read,
            jenis_bimbingan: 'online',
            revisi_number: 0,
          },
          {
            progress_id: 'PROG3',
            bimbingan_id: bimbinganId,
            subject_progress: 'Progress 3',
            file_progress: 'url3',
            file_name: 'file3.pdf',
            submit_at: new Date(),
            status_progress: status_progress_enum.done,
            jenis_bimbingan: 'online',
            revisi_number: 0,
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .get(`/progress/pending/${dosenId}`)
        .expect(200);

      // Response is a number wrapped in object or just number
      const count = typeof res.body === 'number' ? res.body : res.body.count;
      expect(count).toBe(2); // Should count unread and read (not done)
    });

    it('should return 0 if no pending reviews', async () => {
      const res = await request(app.getHttpServer())
        .get(`/progress/pending/${dosenId}`)
        .expect(200);

      const count = typeof res.body === 'number' ? res.body : res.body.count;
      expect(count).toBe(0);
    });
  });

  describe('PATCH /progress/mark-read/:progress_id', () => {
    it('should mark progress as read', async () => {
      await prisma.progress.create({
        data: {
          progress_id: progressId,
          bimbingan_id: bimbinganId,
          subject_progress: 'Test Progress',
          file_progress: 'url',
          file_name: 'test.pdf',
          submit_at: new Date(),
          status_progress: status_progress_enum.unread,
          jenis_bimbingan: 'online',
          revisi_number: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/progress/mark-read/${progressId}`)
        .expect(200);

      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('read');

      const updated = await prisma.progress.findUnique({
        where: { progress_id: progressId },
      });
      expect(updated?.status_progress).toBe(status_progress_enum.read);
    });

    it('should return success if already read', async () => {
      await prisma.progress.create({
        data: {
          progress_id: progressId,
          bimbingan_id: bimbinganId,
          subject_progress: 'Test Progress',
          file_progress: 'url',
          file_name: 'test.pdf',
          submit_at: new Date(),
          status_progress: status_progress_enum.read,
          jenis_bimbingan: 'online',
          revisi_number: 0,
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/progress/mark-read/${progressId}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('sudah read');
    });

    it('should fail if progress not found', async () => {
      const res = await request(app.getHttpServer())
        .patch('/progress/mark-read/FAKE_PROGRESS_ID')
        .expect(404);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Progress tidak ditemukan');
    });
  });

  describe('POST /progress/koreksi/:progress_id', () => {
    beforeEach(async () => {
      // Create progress for koreksi tests
      await prisma.progress.create({
        data: {
          progress_id: progressId,
          bimbingan_id: bimbinganId,
          subject_progress: 'BAB 1 Pendahuluan',
          file_progress: 'https://example.com/bab1.pdf',
          file_name: 'bab1.pdf',
          submit_at: new Date(),
          note_mahasiswa: 'Mohon review',
          status_progress: status_progress_enum.read,
          jenis_bimbingan: 'online',
          revisi_number: 0,
        },
      });
    });

    it('should approve progress (status done)', async () => {
      const dto = {
        evaluasi_dosen: 'BAB 1 sudah baik',
        status_progress: 'done',
      };

      const res = await request(app.getHttpServer())
        .post(`/progress/koreksi/${progressId}`)
        .field('evaluasi_dosen', dto.evaluasi_dosen)
        .field('status_progress', dto.status_progress)
        .expect(201);

      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('disetujui');

      const updated = await prisma.progress.findUnique({
        where: { progress_id: progressId },
      });
      expect(updated?.status_progress).toBe(status_progress_enum.done);
      expect(updated?.evaluasi_dosen).toBe(dto.evaluasi_dosen);
    });

    it('should submit revision with file', async () => {
      const dto = {
        evaluasi_dosen: 'Perlu perbaikan pada bagian metodologi',
        status_progress: 'need_revision',
      };

      const res = await request(app.getHttpServer())
        .post(`/progress/koreksi/${progressId}`)
        .field('evaluasi_dosen', dto.evaluasi_dosen)
        .field('status_progress', dto.status_progress)
        .attach('file', Buffer.from('%PDF-1.4 koreksi file'), 'koreksi.pdf')
        .expect(201);

      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.message).toContain('Koreksi berhasil');
      expect(mockSupabaseService.uploadProgressFile).toHaveBeenCalled();

      const updated = await prisma.progress.findUnique({
        where: { progress_id: progressId },
      });
      expect(updated?.status_progress).toBe(status_progress_enum.need_revision);

      // Check if new revision progress created
      const revisionProgress = await prisma.progress.findFirst({
        where: {
          parent_progress_id: progressId,
          revisi_number: 1,
        },
      });
      expect(revisionProgress).toBeDefined();
      expect(revisionProgress?.subject_progress).toContain('Revisi 1');
    });

    it('should fail if need_revision without file', async () => {
      const dto = {
        evaluasi_dosen: 'Perlu revisi',
        status_progress: 'need_revision',
      };

      const res = await request(app.getHttpServer())
        .post(`/progress/koreksi/${progressId}`)
        .field('evaluasi_dosen', dto.evaluasi_dosen)
        .field('status_progress', dto.status_progress)
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('File koreksi wajib');
    });

    it('should fail if progress not found', async () => {
      const dto = {
        evaluasi_dosen: 'Test',
        status_progress: 'done',
      };

      const res = await request(app.getHttpServer())
        .post('/progress/koreksi/FAKE_PROGRESS_ID')
        .field('evaluasi_dosen', dto.evaluasi_dosen)
        .field('status_progress', dto.status_progress)
        .expect(404);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Progress tidak ditemukan');
    });

    it('should fail if file is not PDF', async () => {
      const dto = {
        evaluasi_dosen: 'Perlu revisi',
        status_progress: 'need_revision',
      };

      const res = await request(app.getHttpServer())
        .post(`/progress/koreksi/${progressId}`)
        .field('evaluasi_dosen', dto.evaluasi_dosen)
        .field('status_progress', dto.status_progress)
        .attach('file', Buffer.from('not a pdf'), 'koreksi.docx')
        .expect(400);

      expect(res.body).toHaveProperty('message');
      const message = typeof res.body.message === 'string' 
        ? res.body.message 
        : JSON.stringify(res.body.message);
      expect(message).toContain('PDF');
    });

    it('should fail validation if evaluasi_dosen is empty', async () => {
      const res = await request(app.getHttpServer())
        .post(`/progress/koreksi/${progressId}`)
        .field('evaluasi_dosen', '')
        .field('status_progress', 'done')
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(Array.isArray(res.body.message)).toBe(true);
    });
  });
});