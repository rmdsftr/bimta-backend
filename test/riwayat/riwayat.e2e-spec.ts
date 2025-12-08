import { INestApplication, ValidationPipe, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../src/prisma/prisma.service";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import request from "supertest";
import { role_enum, status_user_enum, status_progress_enum, jenis_bimbingan_enum, status_jadwal_enum, status_bimbingan_enum } from "@prisma/client";
import { Prisma } from "@prisma/client";


const testMahasiswa = {
    user_id: '2211522023',
    nama: 'talita zulfa amira',
    no_whatsapp: '081234567890',
    sandi: 'hashedpassword123',
    role: role_enum.mahasiswa,
    judul: 'Judul TA mahasiswa 1',
    status_user: status_user_enum.active,
};

const testDosen = {
    user_id: '0909090909',
    nama: 'husnil kamil, MT',
    no_whatsapp: '081234567891',
    sandi: 'hashedpassword456',
    role: role_enum.dosen,
    status_user: status_user_enum.active,
};

const testBimbingan = {
    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
    dosen_id: testDosen.user_id,
    mahasiswa_id: testMahasiswa.user_id,
    status_bimbingan: status_bimbingan_enum.ongoing,
    total_bimbingan: 0
};

const testJadwal = {
    bimbingan_id: testBimbingan.bimbingan_id,
    datetime: new Date('2025-12-01T10:00:00Z'),
    judul_pertemuan: 'Pertemuan 1',
    note_dosen: 'Bagus',
    note_mahasiswa: 'Mahasiswa hadir dan siap',
    lokasi: 'Ruang Dosen 101',
    status_jadwal: status_jadwal_enum.done,
};

const testProgress = {
    progress_id: 'progress-1',
    bimbingan_id: testBimbingan.bimbingan_id,
    subject_progress: 'Bab 1 Draft',
    evaluasi_dosen: 'Perlu revisi',
    submit_at: new Date('2025-12-02T12:00:00Z'),
    status_progress: status_progress_enum.done,
    jenis_bimbingan: jenis_bimbingan_enum.online,
    revisi_number: 0,
    file_progress: 'draft_bab1.pdf',
};

// =================== Test Suite ===================
describe('RIWAYAT system testing (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        prisma = app.get<PrismaService>(PrismaService);

        await app.init();
    });

    beforeEach(async () => {
        await prisma.progress.deleteMany();
        await prisma.jadwal.deleteMany();
        await prisma.bimbingan.deleteMany();
        await prisma.users.deleteMany();

        await prisma.users.createMany({
            data: [testMahasiswa, testDosen]
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    // =================== GET /riwayat/:mahasiswa_id ===================
    describe('GET /riwayat/:mahasiswa_id', () => {

        it('should return empty array if mahasiswa has no bimbingan', async () => {
            const response = await request(app.getHttpServer())
                .get(`/riwayat/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return combined offline and online riwayat sorted by tanggal', async () => {
            await prisma.bimbingan.create({ data: testBimbingan });
            await prisma.jadwal.create({ data: testJadwal });
            await prisma.progress.create({ data: testProgress as Prisma.progressUncheckedCreateInput });
            const response = await request(app.getHttpServer())
                .get(`/riwayat/${testMahasiswa.user_id}`)
                .expect(200);

            expect(response.body).toHaveLength(2);

            // offline
            const offline = response.body.find((r) => r.jenis === jenis_bimbingan_enum.offline);
            expect(offline).toMatchObject({
                id: testBimbingan.bimbingan_id,
                pembahasan: testJadwal.judul_pertemuan,
                hasil: testJadwal.note_dosen,
            });

            // online
            const online = response.body.find((r) => r.jenis === jenis_bimbingan_enum.online);
            expect(online).toMatchObject({
                id: testProgress.progress_id,
                pembahasan: testProgress.subject_progress,
                hasil: testProgress.evaluasi_dosen,
            });

            // sorted by tanggal
            expect(new Date(response.body[0].tanggal).getTime())
                .toBeLessThanOrEqual(new Date(response.body[1].tanggal).getTime());
        });

        it('should return 404 if mahasiswa does not exist', async () => {
            await request(app.getHttpServer())
                .get('/riwayat/99999999')
                .expect(404);
        });
    });
});
