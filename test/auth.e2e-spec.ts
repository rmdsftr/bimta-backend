import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let token: string;

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

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          user_id: '2211523011',
          nama: 'Tegar Ananda',
          no_whatsapp: '081234567890',
          role: 'mahasiswa',
        })
        .expect(201);
    });

    it('should fail with missing fields', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          user_id: '',
          nama: '',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          user_id: '2211523011',
          sandi: '2211523011',
        })
        .expect(200);

      // ✅ fix: ambil token dari body.data
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data).toHaveProperty('refresh_token');
      expect(res.body.data).toHaveProperty('user_id');
      expect(res.body.data).toHaveProperty('nama');

      token = res.body.data.access_token; // ✅ simpan token
    });

    it('should fail with wrong password', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          user_id: '2211523011',
          sandi: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`) // ✅ token udah keisi sekarang
        .expect(201);
    });

    it('should fail without token', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });
});
