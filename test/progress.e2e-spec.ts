import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

// MASIH 3 FAILED, 1 PASSED //

describe('Progress Module (e2e)', () => {
  let app: INestApplication;

  // katanya si untuk Mock upload supaya tidak upload beneran
  const mockSupabase = {
    uploadProgressFile: jest.fn().mockResolvedValue({
      publicUrl: 'https://dummy-url.com/file.pdf',
      filename: 'test-file.pdf',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabase)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  const mahasiswaId = '2211523011';
  const dosenId = 'D001';

  // Ni PDF Palsu yaaaaaaaa
  const fakePdf = Buffer.from('%PDF-1.4 fake pdf content');

  describe('POST /progress/add/:mahasiswa_id', () => {
    it('should upload progress and create record', async () => {
      const res = await request(app.getHttpServer())
        .post(`/progress/add/${mahasiswaId}`)
        .field('subject_progress', 'Bab 1 revisi')
        .field('note_mahasiswa', 'Sudah diperbaiki')
        .attach('file', fakePdf, {
          filename: 'progress.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(res.body).toHaveProperty('count');
    });
  });

  describe('GET /progress/:mahasiswa_id', () => {
    it('should return all online progress', async () => {
      const res = await request(app.getHttpServer())
        .get(`/progress/${mahasiswaId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /progress/dosen/:dosen_id', () => {
    it('should return mahasiswa progress for dosen', async () => {
      const res = await request(app.getHttpServer())
        .get(`/progress/dosen/${dosenId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /progress/pending/:dosen_id', () => {
    it('should return pending review count', async () => {
      const res = await request(app.getHttpServer())
        .get(`/progress/pending/${dosenId}`)
        .expect(200);

      expect(typeof res.body).toBe('number');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
