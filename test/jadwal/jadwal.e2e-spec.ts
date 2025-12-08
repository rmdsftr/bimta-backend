import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import request from "supertest";
import { role_enum, status_bimbingan_enum, status_user_enum } from "@prisma/client";

const testMahasiswa = {
    user_id: '2211522023', 
    nama: 'talita zulfa amira',
    no_whatsapp: '081234567890',
    sandi: 'hashedpassword123', 
    role: role_enum.mahasiswa,
    judul : 'Judul TA mahasiswa 1',
    status_user: status_user_enum.active,
}

const testMahasiswaNoDospem = {
    user_id: '2211522009', 
    nama: 'ramadhani safitri',
    no_whatsapp: '081234567890',
    sandi: 'hashedpassword123', 
    role: role_enum.mahasiswa,
    judul : 'Judul TA mahasiswa 2',
    status_user: status_user_enum.active,
}

const testDosen = {
    user_id: '0909090909', 
    nama: 'husnil kamil, MT',
    no_whatsapp: '081234567891',
    sandi: 'hashedpassword456',
    role: role_enum.dosen,
    status_user: status_user_enum.active,
}

const testBimbingan = {
    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
    dosen_id: testDosen.user_id,
    mahasiswa_id: testMahasiswa.user_id,
    status_bimbingan: status_bimbingan_enum.ongoing,
    total_bimbingan: 0
}

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
    })

    afterAll(async() =>{
        await prisma.$disconnect()
        await app.close();
    })

    beforeEach(async () => {
        await prisma.progress.deleteMany();
        await prisma.jadwal.deleteMany();
        await prisma.jadwal_dosen.deleteMany();
        await prisma.bimbingan.deleteMany();
        await prisma.users.deleteMany();

        await prisma.users.createMany({
            data: [testMahasiswa, testMahasiswaNoDospem, testDosen]
        })

        await prisma.bimbingan.create({
            data: testBimbingan
        })
    })

    describe('POST /jadwal/add/:mahasiswa_id', () => {
        it('return berhasil menambahkan jadwal dengan data yang valid', async () => {
            const dto = {
                judul: 'Bimbingan Skripsi Bab 1',
                tanggal: '2025-01-15',
                waktu: '10:00',
                lokasi: 'Ruang Dosen 301',
                pesan: 'Mohon review bab 1',
            };

            
            const response = await request(app.getHttpServer())
                .post(`/jadwal/add/${testMahasiswa.user_id}`)  
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

        it('return 400 kalau data yang dikirim tidak lengkap', async () => {
            const invalidDto = {
                judul: 'Test',
                
                waktu: '10:00',
            };

            await request(app.getHttpServer())
                .post(`/jadwal/add/${testMahasiswa.user_id}`)  
                .send(invalidDto)
                .expect(400);
        });

        it('return 404 kalau mahasiswa tidak punya dospem', async () => {
            const dto = {
                judul: 'Test',
                tanggal: '2025-01-15',
                waktu: '10:00',
                lokasi: 'Ruang A',
                pesan: 'Test',
            };

            await request(app.getHttpServer())
                .post(`/jadwal/add/${testMahasiswaNoDospem.user_id}`)  
                .send(dto)
                .expect(404);
        });
    });

    describe('GET /jadwal/view/:mahasiswa_id', () => {
        beforeEach(async () => {
            await prisma.jadwal.create({
                data: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
                    judul_pertemuan: 'Bimbingan 1',
                    datetime: new Date('2025-01-15T10:00:00'),
                    lokasi: 'Ruang A',
                    note_mahasiswa: 'Test note',
                    status_jadwal: 'waiting',
                },
            });
        });

        it('return list jadwal mahasiswa', async () => {
            const response = await request(app.getHttpServer())
                .get(`/jadwal/view/${testMahasiswa.user_id}`)  
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('subjek');
            expect(response.body[0]).toHaveProperty('tanggal');
            expect(response.body[0]).toHaveProperty('status');
        });

        it('return 404 kalau mahasiswa tidak memiliki dospem', async () => {
            await request(app.getHttpServer())
                .get(`/jadwal/view/${testMahasiswaNoDospem.user_id}`)  
                .expect(404);
        });
    });

    describe('GET /jadwal/dosen/:dosen_id', () => {
        beforeEach(async () => {
            await prisma.jadwal.create({
                data: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
                    judul_pertemuan: 'Bimbingan Dosen',
                    datetime: new Date('2025-01-20T14:00:00'),
                    lokasi: 'Ruang Dosen',
                    note_mahasiswa: 'Request bimbingan',
                    status_jadwal: 'waiting',
                },
            });
        });

        it('return list jadwal untuk dosen', async () => {
            const response = await request(app.getHttpServer())
                .get(`/jadwal/dosen/${testDosen.user_id}`)  
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
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
                    judul_pertemuan: 'To Be Accepted',
                    datetime: new Date('2025-01-25T09:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Please accept',
                    status_jadwal: 'waiting',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('kalau jadwal accepted berhasil', async () => {
            const updateDto = {
                note_dosen: 'Jadwal disetujui, silakan datang tepat waktu',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/terima/${testDosen.user_id}-${testMahasiswa.user_id}/${encodeURIComponent(jadwalDatetime)}`)  
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline disetujui');

            const updatedJadwal = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
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
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
                    judul_pertemuan: 'To Be Declined',
                    datetime: new Date('2025-01-26T11:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Request',
                    status_jadwal: 'waiting',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('kalau jadwal declined dengan alasan', async () => {
            const updateDto = {
                note_dosen: 'Maaf, jadwal bentrok dengan rapat fakultas',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/tolak/${testDosen.user_id}-${testMahasiswa.user_id}/${encodeURIComponent(jadwalDatetime)}`)  
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline ditolak');

            const updatedJadwal = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
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
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
                    judul_pertemuan: 'To Be Cancelled',
                    datetime: new Date('2025-01-27T13:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Original note',
                    status_jadwal: 'waiting',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('bimbingan dibatalkan', async () => {
            const updateDto = {
                note_dosen: 'Dibatalkan oleh mahasiswa',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/cancel/${testDosen.user_id}-${testMahasiswa.user_id}/${encodeURIComponent(jadwalDatetime)}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline dibatalkan');

            const cancelled = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
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
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
                    judul_pertemuan: 'Completed Meeting',
                    datetime: new Date('2025-01-28T15:00:00'),
                    lokasi: 'Ruang Test',
                    note_mahasiswa: 'Meeting request',
                    status_jadwal: 'accepted',
                },
            });
            
            jadwalDatetime = jadwal.datetime.toISOString();
        });

        it('status jadwal selesai/done', async () => {
            const updateDto = {
                note_dosen: 'Bimbingan selesai, lanjutkan ke bab 2',
            };

            const response = await request(app.getHttpServer())
                .patch(`/jadwal/done/${testDosen.user_id}-${testMahasiswa.user_id}/${encodeURIComponent(jadwalDatetime)}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Bimbingan offline selesai');

            const completed = await prisma.jadwal.findFirst({
                where: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
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
                .post(`/jadwal/add/${testMahasiswa.user_id}`)
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
                .get(`/jadwal/view/${testMahasiswa.user_id}`)
                .expect(200);

            expect(viewResponse.body.length).toBeGreaterThan(0);
            const createdJadwal = viewResponse.body[0];
            expect(createdJadwal.status).toBe('waiting');

            
            const dosenViewResponse = await request(app.getHttpServer())
                .get(`/jadwal/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(dosenViewResponse.body.length).toBeGreaterThan(0);

            
            const jadwalFromDB = await prisma.jadwal.findFirst({
                where: { judul_pertemuan: 'End-to-End Test Bimbingan' },
            });

            if (jadwalFromDB) {
                await request(app.getHttpServer())
                    .patch(`/jadwal/terima/${testDosen.user_id}-${testMahasiswa.user_id}/${encodeURIComponent(jadwalFromDB.datetime.toISOString())}`)
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