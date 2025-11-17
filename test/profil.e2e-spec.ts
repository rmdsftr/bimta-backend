import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Profil Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --------- VIEW PROFILE ----------
  describe('GET /profil/view/:id', () => {
    it('should return profile data', async () => {
      const res = await request(app.getHttpServer())
        .get('/profil/view/2211523011')
        .expect(200);

      expect(res.body).toHaveProperty('user_id');
      expect(res.body).toHaveProperty('nama');
      expect(res.body).toHaveProperty('status_bimbingan');
    });
  });

  // --------- CHANGE NUMBER ----------
  describe('PATCH /profil/changeNumber/:id', () => {
    it('should update whatsapp number', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profil/changeNumber/2211523011')
        .send({
          nomorBaru: '081234567890'
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });

  // --------- GET INFO MAHASISWA ----------
  describe('GET /profil/mahasiswa/:id', () => {
    it('should get mahasiswa info', async () => {
      const res = await request(app.getHttpServer())
        .get('/profil/mahasiswa/2211523011')
        .expect(200);

      expect(res.body).toHaveProperty('judul');
      expect(res.body).toHaveProperty('no_whatsapp');
    });
  });

  // --------- GANTI JUDUL ----------
  describe('PATCH /profil/gantiJudul/:id', () => {
    it('should update temp title', async () => {
      await request(app.getHttpServer())
        .patch('/profil/gantiJudul/2211523011')
        .send({
          judulBaru: 'Judul Baru Testing'
        })
        .expect(200);
    });
  });
});
