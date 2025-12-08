import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { SetupTestDB, teardownTestDB } from "../setup-e2e";
import request from "supertest";

describe('JADWAL system testing (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async() => {
        const moduleFixture : TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());

        prisma = app.get<PrismaService>(PrismaService);

        await app.init();
        await SetupTestDB();
    })

    afterAll(async() =>{
        await teardownTestDB();
        await app.close();
    })

    beforeEach(async () => {
        await prisma.jadwal.deleteMany();
    })

    describe('POST /jadwal/add/:mahasiswa_id', () => {
        it('should successfully add jadwal with valid data', async () => {
            const dto = {
                judul: 'Bimbingan Skripsi Bab 1',
                tanggal: '2025-01-15',
                waktu: '10:00',
                lokasi: 'Ruang Dosen 301',
                pesan: 'Mohon review bab 1',
            };

            
            const response = await request(app.getHttpServer())
                .post('/jadwal/add/2211522023')  
                .send(dto)
                .expect(201);

            expect(response.body).toHaveProperty('count');
            expect(response.body.count).toBeGreaterThan(0);

            const jadwalInDB = await prisma.jadwal.findFirst({
                where: { judul_pertemuan: dto.judul },
            });
            
            expect(jadwalInDB).not.toBeNull();
            if (jadwalInDB) {
                expect(jadwalInDB.lokasi).toBe(dto.lokasi);
                expect(jadwalInDB.status_jadwal).toBe('waiting');
            }
        });

        it('should return 400 when required fields missing', async () => {
            const invalidDto = {
                judul: 'Test',
                
                waktu: '10:00',
            };

            await request(app.getHttpServer())
                .post('/jadwal/add/2211522023')  
                .send(invalidDto)
                .expect(400);
        });

        it('should return 404 when mahasiswa has no bimbingan', async () => {
            await prisma.users.create({
                data: { 
                    user_id: 'M999', 
                    nama: 'Mahasiswa Tanpa Bimbingan',
                    no_whatsapp: '081999999999',
                    sandi: 'hashedpassword',
                    role: 'mahasiswa',
                    status_user: 'active',
                },
            });

            const dto = {
                judul: 'Test',
                tanggal: '2025-01-15',
                waktu: '10:00',
                lokasi: 'Ruang A',
                pesan: 'Test',
            };

            await request(app.getHttpServer())
                .post('/jadwal/add/M999')  
                .send(dto)
                .expect(404);
        });
    });

    describe('GET /jadwal/view/:mahasiswa_id', () => {
        beforeEach(async () => {
            await prisma.jadwal.create({
                data: {
                    bimbingan_id: 'B1',
                    judul_pertemuan: 'Bimbingan 1',
                    datetime: new Date('2025-01-15T10:00:00'),
                    lokasi: 'Ruang A',
                    note_mahasiswa: 'Test note',
                    status_jadwal: 'waiting',
                },
            });
        });

        it('should return list of jadwal for mahasiswa', async () => {
            const response = await request(app.getHttpServer())
                .get('/jadwal/view/2211522023')  
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('subjek');
            expect(response.body[0]).toHaveProperty('tanggal');
            expect(response.body[0]).toHaveProperty('status');
        });

        it('should return 404 when mahasiswa has no bimbingan', async () => {
            await request(app.getHttpServer())
                .get('/jadwal/view/M999')  
                .expect(404);
        });
    });

    describe('GET /jadwal/dosen/:dosen_id', () => {
        beforeEach(async () => {
            await prisma.jadwal.create({
                data: {
                    bimbingan_id: 'B1',
                    judul_pertemuan: 'Bimbingan Dosen',
                    datetime: new Date('2025-01-20T14:00:00'),
                    lokasi: 'Ruang Dosen',
                    note_mahasiswa: 'Request bimbingan',
                    status_jadwal: 'waiting',
                },
            });
        });

        it('should return list of jadwal for dosen', async () => {
            const response = await request(app.getHttpServer())
                .get('/jadwal/dosen/0909090909')  
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('bimbingan_id');
            expect(response.body[0]).toHaveProperty('nama');
            expect(response.body[0]).toHaveProperty('tanggal');
        });
    });

    describe('PATCH /jadwal/terima/:bimbingan_id/:datetime', () => {
        let jadwalDatetime: string;

        beforeEach(async () => {
            const jadwal = await prisma.jadwal.create({
                data: {
                    bimbingan_id: 'B1',
                    judul_pertemuan: 'To Be Accepted',
                    datetime: new Date('2025-01-25T09:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Please accept',
                    status_jadwal: 'waiting',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('should accept jadwal successfully', async () => {
            const updateDto = {
                note_dosen: 'Jadwal disetujui, silakan datang tepat waktu',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/terima/B1/${encodeURIComponent(jadwalDatetime)}`)  
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline disetujui');

            const updatedJadwal = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: 'B1',
                    datetime: new Date(jadwalDatetime),
                },
            });

            expect(updatedJadwal).not.toBeNull();
            if (updatedJadwal) {
                expect(updatedJadwal.status_jadwal).toBe('accepted');
                expect(updatedJadwal.note_dosen).toBe(updateDto.note_dosen);
            }
        });
    });

    describe('PATCH /jadwal/tolak/:bimbingan_id/:datetime', () => {
        let jadwalDatetime: string;

        beforeEach(async () => {
            const jadwal = await prisma.jadwal.create({
                data: {
                    bimbingan_id: 'B1',
                    judul_pertemuan: 'To Be Declined',
                    datetime: new Date('2025-01-26T11:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Request',
                    status_jadwal: 'waiting',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('should decline jadwal with reason', async () => {
            const updateDto = {
                note_dosen: 'Maaf, jadwal bentrok dengan rapat fakultas',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/tolak/B1/${encodeURIComponent(jadwalDatetime)}`)  
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline ditolak');

            const updatedJadwal = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: 'B1',
                    datetime: new Date(jadwalDatetime),
                },
            });

            expect(updatedJadwal).not.toBeNull();
            if (updatedJadwal) {
                expect(updatedJadwal.status_jadwal).toBe('declined');
                expect(updatedJadwal.note_dosen).toContain('bentrok');
            }
        });
    });

    describe('PATCH /jadwal/cancel/:bimbingan_id/:datetime', () => {
        let jadwalDatetime: string;

        beforeEach(async () => {
            const jadwal = await prisma.jadwal.create({
                data: {
                    bimbingan_id: 'B1',
                    judul_pertemuan: 'To Be Cancelled',
                    datetime: new Date('2025-01-27T13:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Original note',
                    status_jadwal: 'waiting',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('should allow mahasiswa to cancel jadwal', async () => {
            const updateDto = {
                note_dosen: 'Dibatalkan oleh mahasiswa',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/cancel/B1/${encodeURIComponent(jadwalDatetime)}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline dibatalkan');

            const cancelled = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: 'B1',
                    datetime: new Date(jadwalDatetime),
                },
            });

            expect(cancelled).not.toBeNull();
            if (cancelled) {
                expect(cancelled.status_jadwal).toBe('declined');
            }
        });
    });

    describe('PATCH /jadwal/done/:bimbingan_id/:datetime', () => {
        let jadwalDatetime: string;

        beforeEach(async () => {
            const jadwal = await prisma.jadwal.create({
                data: {
                    bimbingan_id: 'B1',
                    judul_pertemuan: 'Completed Meeting',
                    datetime: new Date('2025-01-28T15:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Meeting request',
                    status_jadwal: 'accepted',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('should mark jadwal as done', async () => {
            const updateDto = {
                note_dosen: 'Bimbingan selesai, lanjutkan ke bab 2',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/done/B1/${encodeURIComponent(jadwalDatetime)}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline selesai');

            const completed = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: 'B1',
                    datetime: new Date(jadwalDatetime),
                },
            });

            expect(completed).not.toBeNull();
            if (completed) {
                expect(completed.status_jadwal).toBe('done');
                expect(completed.note_dosen).toContain('selesai');
            }
        });
    });

    
    describe('Complete Workflow Integration', () => {
        it('should handle complete jadwal lifecycle', async () => {
            
            const addResponse = await request(app.getHttpServer())
                .post('/jadwal/add/2211522023')
                .send({
                    judul: 'End-to-End Test Bimbingan',
                    tanggal: '2025-02-01',
                    waktu: '10:00',
                    lokasi: 'Ruang E2E',
                    pesan: 'Testing complete flow',
                })
                .expect(201);

            expect(addResponse.body.count).toBe(1);

            
            const viewResponse = await request(app.getHttpServer())
                .get('/jadwal/view/2211522023')
                .expect(200);

            expect(viewResponse.body.length).toBeGreaterThan(0);
            const createdJadwal = viewResponse.body[0];
            expect(createdJadwal.status).toBe('waiting');

            
            const dosenViewResponse = await request(app.getHttpServer())
                .get('/jadwal/dosen/0909090909')
                .expect(200);

            expect(dosenViewResponse.body.length).toBeGreaterThan(0);

            
            const jadwalFromDB = await prisma.jadwal.findFirst({
                where: { judul_pertemuan: 'End-to-End Test Bimbingan' },
            });

            if (jadwalFromDB) {
                await request(app.getHttpServer())
                    .patch(`/jadwal/terima/B1/${encodeURIComponent(jadwalFromDB.datetime.toISOString())}`)
                    .send({ note_dosen: 'Disetujui untuk e2e test' })
                    .expect(200);

                
                const finalState = await prisma.jadwal.findFirst({
                    where: { judul_pertemuan: 'End-to-End Test Bimbingan' },
                });

                expect(finalState).not.toBeNull();
                if (finalState) {
                    expect(finalState.status_jadwal).toBe('accepted');
                    expect(finalState.note_dosen).toContain('Disetujui');
                }
            }
        });
    });
})