import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Kegiatan Module (e2e)', () => {
  let app: INestApplication;

  // Pakai data yang memang sudah ada di database
  const dosenId = '1234567890';
  const mahasiswaId = '2211523011';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/POST kegiatan/add/:dosen_id', () => {
    it('should add kegiatan, then get it by month and date', async () => {

      const dto = {
        kegiatan: 'Rapat Bimbingan',
        tanggal: '2025-01-15',
        jam_mulai: '09:00',
        jam_selesai: '10:00',
      };

      const postRes = await request(app.getHttpServer())
        .post(`/kegiatan/add/${dosenId}`)
        .send(dto)
        .expect(201);

      const jadwalId = postRes.body.jadwal_dosen_id;
      expect(jadwalId).toBeDefined();


      const monthRes = await request(app.getHttpServer())
        .get(`/kegiatan/dosen/${dosenId}?year=2025&month=1`)
        .expect(200);

      expect(monthRes.body.some(x => x.jadwal_dosen_id === jadwalId)).toBe(true);

      const dateRes = await request(app.getHttpServer())
        .get(`/kegiatan/dosen/${dosenId}/date/2025-01-15`)
        .expect(200);

      expect(dateRes.body.length).toBeGreaterThan(0);

    
    //   await request(app.getHttpServer())
    //     .delete(`/kegiatan/${jadwalId}`)
    //     .expect(200);

    
    //   const monthCheck = await request(app.getHttpServer())
    //     .get(`/kegiatan/dosen/${dosenId}?year=2025&month=1`)
    //     .expect(200);

    //   expect(monthCheck.body.some(x => x.jadwal_dosen_id === jadwalId)).toBe(false);
    });
  });


  describe('/GET mahasiswa/:mahasiswa_id by month', () => {
    it('should get kegiatan dosen by month for mahasiswa', async () => {

      const dto = {
        kegiatan: 'Kegiatan Mahasiswa',
        tanggal: '2025-02-10',
        jam_mulai: '13:00',
        jam_selesai: '14:00',
      };

      
      const postRes = await request(app.getHttpServer())
        .post(`/kegiatan/add/${dosenId}`)
        .send(dto)
        .expect(201);

      
      const monthRes = await request(app.getHttpServer())
        .get(`/kegiatan/mahasiswa/${mahasiswaId}?year=2025&month=2`)
        .expect(200);

      expect(monthRes.body.length).toBeGreaterThan(0);

      expect(
        monthRes.body.some(x => x.kegiatan === 'Kegiatan Mahasiswa')
      ).toBe(true);

    });
  });

});
