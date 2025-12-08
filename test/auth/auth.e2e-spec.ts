import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

describe('AUTH system testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.progress.deleteMany();
    await prisma.jadwal_dosen.deleteMany();
    await prisma.jadwal.deleteMany();
    await prisma.bimbingan.deleteMany();
    await prisma.users.deleteMany();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const dto = {
        user_id: 'U100',
        nama: 'Test User',
        no_whatsapp: '081234567890',
        sandi: '123456',
        role: 'mahasiswa',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(201);

      expect(response.body).toHaveProperty('user_id', dto.user_id);
      expect(response.body).toHaveProperty('nama', dto.nama);
      expect(response.body).toHaveProperty('role', dto.role);

      const userInDB = await prisma.users.findUnique({
        where: { user_id: dto.user_id },
      });
      expect(userInDB).not.toBeNull();
    });

    it('should fail if user already exists', async () => {
      await prisma.users.create({
        data: {
          user_id: 'U100',
          nama: 'Existing User',
          no_whatsapp: '081234567890',
          sandi: await bcrypt.hash('123456', 12),
          role: 'mahasiswa',
          status_user: 'active',
        },
      });

      const dto = {
        user_id: 'U100',
        nama: 'Test User',
        no_whatsapp: '081234567890',
        sandi: '123456',
        role: 'mahasiswa',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await prisma.users.create({
        data: {
          user_id: '2211522023',
          nama: 'Talitha Zulfa Amirah',
          no_whatsapp: '081234567890',
          sandi: await bcrypt.hash('password123', 12),
          role: 'mahasiswa',
          status_user: 'active',
        },
      });
    });

    it('should login successfully with correct credentials', async () => {
      const dto = {
        user_id: '2211522023',
        sandi: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(dto)
        .expect(201); 

      expect(response.body).toHaveProperty('message', 'Login berhasil');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
    });

    it('should fail login with incorrect password', async () => {
      const dto = {
        user_id: '2211522023',
        sandi: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(dto)
        .expect(400); 
    });

    it('should fail login if user not found', async () => {
      const dto = {
        user_id: 'U999',
        sandi: 'password',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(dto)
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      await prisma.users.create({
        data: {
          user_id: '2211522023',
          nama: 'Talitha Zulfa Amirah',
          no_whatsapp: '081234567890',
          sandi: await bcrypt.hash('password123', 12),
          role: 'mahasiswa',
          status_user: 'active',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          user_id: '2211522023',
          sandi: 'password123',
        });

      const token = loginResponse.body.data.access_token;

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(201); 

      expect(response.body).toHaveProperty('success', true); // <-- ganti status -> success
      expect(response.body).toHaveProperty('message', 'Logout berhasil');
    });

    it('should fail logout if token missing', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });
});
