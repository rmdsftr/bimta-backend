import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// 7 PASSED, 2 (APPROVE SAMA REJECT JUDUL) BELUM LAGI //

describe('Profil Module (e2e)', () => {
  let app: INestApplication;
  const testId = '2211523011';

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

  describe('GET /profil/view/:id', () => {
    it('should return profile data', async () => {
      const res = await request(app.getHttpServer())
        .get(`/profil/view/${testId}`)
        .expect(200);

      expect(res.body).toHaveProperty('user_id');
      expect(res.body).toHaveProperty('nama');
      expect(res.body).toHaveProperty('status_bimbingan');
    });
  });

  describe('PATCH /profil/changeNumber/:id', () => {
    it('should update whatsapp number', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/profil/changeNumber/${testId}`)
        .send({ nomorBaru: '081234567890' })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /profil/mahasiswa/:id', () => {
    it('should get mahasiswa info', async () => {
      const res = await request(app.getHttpServer())
        .get(`/profil/mahasiswa/${testId}`)
        .expect(200);

      expect(res.body).toHaveProperty('judul');
      expect(res.body).toHaveProperty('no_whatsapp');
    });
  });

  describe('PATCH /profil/gantiJudul/:id', () => {
    it('should update temp title', async () => {
      await request(app.getHttpServer())
        .patch(`/profil/gantiJudul/${testId}`)
        .send({ judulBaru: 'Judul Baru Testing' })
        .expect(200);
    });
  });

  // describe('PATCH /profil/accJudul/:id', () => {
  //   it('should approve title change', async () => {
  //     const res = await request(app.getHttpServer())
  //       .patch(`/profil/accJudul/${testId}`)
  //       .expect(200);

  //     expect(res.body).toBe(true);
  //   });
  // });

  // describe('PATCH /profil/rejectJudul/:id', () => {
  //   it('should reject title change', async () => {
  //     const res = await request(app.getHttpServer())
  //       .patch(`/profil/rejectJudul/${testId}`)
  //       .expect(200);

  //     expect(res.body).toBe(true);
  //   });
  // });

  describe('GET /profil/foto/:id', () => {
    it('should return photo url (string value)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/profil/foto/${testId}`)
        .expect(200);

      expect(typeof res.text).toBe('string');
    });
  });

  describe('PATCH /profil/change/:id (photo)', () => {
    it('should change photo (mock upload)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/profil/change/${testId}`)
        .attach('file', Buffer.from('fake image data'), {
          filename: 'test.png',
          contentType: 'image/png',
        })
        .expect(200);

      expect(typeof res.text).toBe('string');
    });
  });


  describe('POST /profil/change/:id (password)', () => {
    it('should change password', async () => {
      const res = await request(app.getHttpServer())
        .post(`/profil/change/${testId}`)
        .send({
          sandiLama: 'sandiBaru015',
          sandiBaru: 'sandiBaru016',
          konfirmasiSandi: 'sandiBaru016',
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });
});
