import { INestApplication, ValidationPipe } from "@nestjs/common"
import { PrismaService } from "../../src/prisma/prisma.service";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { role_enum, status_bimbingan_enum, status_user_enum, status_jadwal_enum, status_progress_enum, jenis_bimbingan_enum } from "@prisma/client";
import request from 'supertest';

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

const testReferensiTA = {
    nim_mahasiswa: '2111522001',
    nama_mahasiswa: 'Ahmad Hidayat',
    judul: 'Implementasi Machine Learning untuk Prediksi Cuaca',
    doc_url: 'https://example.com/doc1.pdf',
    topik: 'Machine Learning',
    tahun: 2023
}

const testProgress = {
    progress_id: 'prog-001',
    bimbingan_id: testBimbingan.bimbingan_id,
    subject_progress: 'BAB I - Pendahuluan',
    file_progress: 'https://example.com/bab1.pdf',
    submit_at: new Date('2024-01-15T10:00:00Z'),
    koreksi_at: new Date('2024-01-16T14:00:00Z'),
    file_koreksi: 'https://example.com/bab1_koreksi.pdf',
    evaluasi_dosen: 'Perlu perbaikan pada latar belakang',
    status_progress: status_progress_enum.need_revision,
    jenis_bimbingan: jenis_bimbingan_enum.online,
    revisi_number: 1,
    file_name: 'bab1.pdf'
}

const testProgressUnread = {
    progress_id: 'prog-002',
    bimbingan_id: testBimbingan.bimbingan_id,
    subject_progress: 'BAB II - Tinjauan Pustaka',
    file_progress: 'https://example.com/bab2.pdf',
    submit_at: new Date('2024-01-20T10:00:00Z'),
    status_progress: status_progress_enum.unread,
    jenis_bimbingan: jenis_bimbingan_enum.offline,
    revisi_number: 1,
    file_name: 'bab2.pdf'
}

const testJadwal = {
    bimbingan_id: testBimbingan.bimbingan_id,
    datetime: new Date('2024-01-25T09:00:00Z'),
    lokasi: 'Ruang Dosen Lantai 3',
    note_mahasiswa: 'Konsultasi BAB III',
    note_dosen: 'Siap',
    status_jadwal: status_jadwal_enum.accepted,
    judul_pertemuan: 'Bimbingan BAB III'
}

const testJadwalWaiting = {
    bimbingan_id: testBimbingan.bimbingan_id,
    datetime: new Date('2024-01-30T14:00:00Z'),
    lokasi: 'Online - Zoom',
    note_mahasiswa: 'Konsultasi BAB IV',
    status_jadwal: status_jadwal_enum.waiting,
    judul_pertemuan: 'Bimbingan BAB IV'
}

describe('GENERAL system testing (e2e)', () => {
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
        await prisma.referensi_ta.deleteMany();
        await prisma.users.deleteMany();

        await prisma.users.createMany({
            data: [testMahasiswa, testMahasiswaNoDospem, testDosen]
        })

        await prisma.bimbingan.create({
            data: testBimbingan
        })
    })

    describe('GET /general/ta', () => {
        it('should return empty array when no referensi TA exists', async () => {
            const response = await request(app.getHttpServer())
                .get('/general/ta')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return all referensi TA', async () => {
            await prisma.referensi_ta.create({
                data: testReferensiTA
            });

            const response = await request(app.getHttpServer())
                .get('/general/ta')
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                nim_mahasiswa: testReferensiTA.nim_mahasiswa,
                nama_mahasiswa: testReferensiTA.nama_mahasiswa,
                judul: testReferensiTA.judul,
                doc_url: testReferensiTA.doc_url,
                topik: testReferensiTA.topik,
                tahun: testReferensiTA.tahun
            });
        });

        it('should return multiple referensi TA', async () => {
            const testReferensiTA2 = {
                nim_mahasiswa: '2111522002',
                nama_mahasiswa: 'Siti Nurhaliza',
                judul: 'Sistem Informasi Manajemen Perpustakaan',
                doc_url: 'https://example.com/doc2.pdf',
                topik: 'Sistem Informasi',
                tahun: 2023
            };

            await prisma.referensi_ta.createMany({
                data: [testReferensiTA, testReferensiTA2]
            });

            const response = await request(app.getHttpServer())
                .get('/general/ta')
                .expect(200);

            expect(response.body).toHaveLength(2);
        });
    });

    describe('GET /general/mahasiswa/:dosen_id', () => {
        it('should return mahasiswa without dospem from specific dosen', async () => {
            const response = await request(app.getHttpServer())
                .get(`/general/mahasiswa/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                user_id: testMahasiswaNoDospem.user_id,
                nama: testMahasiswaNoDospem.nama
            });
        });

        it('should return all mahasiswa when dosen has no bimbingan', async () => {
            const testDosen2 = {
                user_id: '1010101010',
                nama: 'Dosen Baru',
                no_whatsapp: '081234567892',
                sandi: 'hashedpassword789',
                role: role_enum.dosen,
                status_user: status_user_enum.active,
            };

            await prisma.users.create({
                data: testDosen2
            });

            const response = await request(app.getHttpServer())
                .get(`/general/mahasiswa/${testDosen2.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body.map((m: any) => m.user_id)).toContain(testMahasiswa.user_id);
            expect(response.body.map((m: any) => m.user_id)).toContain(testMahasiswaNoDospem.user_id);
        });

        it('should return empty array when all mahasiswa already have bimbingan with dosen', async () => {
            await prisma.bimbingan.create({
                data: {
                    bimbingan_id: `${testDosen.user_id}-${testMahasiswaNoDospem.user_id}`,
                    dosen_id: testDosen.user_id,
                    mahasiswa_id: testMahasiswaNoDospem.user_id,
                    status_bimbingan: status_bimbingan_enum.ongoing,
                    total_bimbingan: 0
                }
            });

            const response = await request(app.getHttpServer())
                .get(`/general/mahasiswa/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(0);
        });
    });

    describe('GET /general/terkini/mahasiswa/:mahasiswa_id', () => {
        it('should return empty array when no activities exist', async () => {
            const response = await request(app.getHttpServer())
                .get(`/general/terkini/mahasiswa/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return progress with need_revision status', async () => {
            await prisma.progress.create({
                data: testProgress
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/mahasiswa/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                progress_id: testProgress.progress_id,
                nama: testProgress.subject_progress,
                icon: 'progress'
            });
            expect(new Date(response.body[0].tanggal)).toEqual(testProgress.koreksi_at);
        });

        it('should return accepted jadwal', async () => {
            await prisma.jadwal.create({
                data: testJadwal
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/mahasiswa/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                bimbingan_id: testJadwal.bimbingan_id,
                nama: testJadwal.judul_pertemuan,
                icon: 'jadwal'
            });
            expect(new Date(response.body[0].tanggal)).toEqual(testJadwal.datetime);
        });

        it('should return combined and sorted activities (most recent first)', async () => {
            await prisma.progress.create({
                data: testProgress
            });

            await prisma.jadwal.create({
                data: testJadwal
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/mahasiswa/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            
            // Check sorting - most recent first
            const dates = response.body.map((item: any) => new Date(item.tanggal).getTime());
            expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
        });

        it('should not return progress with status other than need_revision', async () => {
            await prisma.progress.createMany({
                data: [
                    testProgress,
                    testProgressUnread
                ]
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/mahasiswa/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].progress_id).toBe(testProgress.progress_id);
        });

        it('should not return jadwal with status other than accepted', async () => {
            await prisma.jadwal.createMany({
                data: [
                    testJadwal,
                    testJadwalWaiting
                ]
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/mahasiswa/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].nama).toBe(testJadwal.judul_pertemuan);
        });
    });

    describe('GET /general/terkini/dosen/:dosen_id', () => {
        it('should return empty array when no activities exist', async () => {
            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return progress with unread status', async () => {
            await prisma.progress.create({
                data: testProgressUnread
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                progress_id: testProgressUnread.progress_id,
                nama: testProgressUnread.subject_progress,
                icon: 'progress'
            });
            expect(new Date(response.body[0].tanggal)).toEqual(testProgressUnread.submit_at);
        });

        it('should return progress with read status', async () => {
            const testProgressRead = {
                ...testProgressUnread,
                progress_id: 'prog-003',
                status_progress: status_progress_enum.read,
                submit_at: new Date('2024-01-21T10:00:00Z')
            };

            await prisma.progress.create({
                data: testProgressRead
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].progress_id).toBe(testProgressRead.progress_id);
        });

        it('should return waiting jadwal', async () => {
            await prisma.jadwal.create({
                data: testJadwalWaiting
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                bimbingan_id: testJadwalWaiting.bimbingan_id,
                nama: testJadwalWaiting.judul_pertemuan,
                icon: 'jadwal'
            });
        });

        it('should return accepted jadwal', async () => {
            await prisma.jadwal.create({
                data: testJadwal
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].nama).toBe(testJadwal.judul_pertemuan);
        });

        it('should return combined and sorted activities (most recent first)', async () => {
            await prisma.progress.create({
                data: testProgressUnread
            });

            await prisma.jadwal.create({
                data: testJadwal
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            
            // Check sorting - most recent first
            const dates = response.body.map((item: any) => new Date(item.tanggal).getTime());
            expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
        });

        it('should not return progress with status need_revision or done', async () => {
            const testProgressDone = {
                ...testProgressUnread,
                progress_id: 'prog-004',
                status_progress: status_progress_enum.done
            };

            await prisma.progress.createMany({
                data: [
                    testProgressUnread,
                    testProgress,
                    testProgressDone
                ]
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].progress_id).toBe(testProgressUnread.progress_id);
        });

        it('should not return jadwal with status declined or done', async () => {
            const testJadwalDeclined = {
                bimbingan_id: testBimbingan.bimbingan_id,
                datetime: new Date('2024-02-01T10:00:00Z'),
                lokasi: 'Ruang Dosen',
                note_mahasiswa: 'Konsultasi',
                status_jadwal: status_jadwal_enum.declined,
                judul_pertemuan: 'Bimbingan Ditolak'
            };

            await prisma.jadwal.createMany({
                data: [
                    testJadwalWaiting,
                    testJadwalDeclined
                ]
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].nama).toBe(testJadwalWaiting.judul_pertemuan);
        });

        it('should handle multiple bimbingan from different mahasiswa', async () => {
            const testBimbingan2 = {
                bimbingan_id: `${testDosen.user_id}-${testMahasiswaNoDospem.user_id}`,
                dosen_id: testDosen.user_id,
                mahasiswa_id: testMahasiswaNoDospem.user_id,
                status_bimbingan: status_bimbingan_enum.ongoing,
                total_bimbingan: 0
            };

            await prisma.bimbingan.create({
                data: testBimbingan2
            });

            const testProgress2 = {
                ...testProgressUnread,
                progress_id: 'prog-005',
                bimbingan_id: testBimbingan2.bimbingan_id,
                submit_at: new Date('2024-01-22T10:00:00Z')
            };

            await prisma.progress.createMany({
                data: [testProgressUnread, testProgress2]
            });

            const response = await request(app.getHttpServer())
                .get(`/general/terkini/dosen/${testDosen.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
        });
    });
});