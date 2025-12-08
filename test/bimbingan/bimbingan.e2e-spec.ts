import { INestApplication, ValidationPipe } from "@nestjs/common"
import { PrismaService } from "../../src/prisma/prisma.service";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import request from "supertest"
import { role_enum, status_bimbingan_enum, status_user_enum, status_progress_enum, jenis_bimbingan_enum, status_jadwal_enum } from "@prisma/client";

const testMahasiswa = {
    user_id: '2211522023', 
    nama: 'talita zulfa amira',
    no_whatsapp: '081234567890',
    sandi: 'hashedpassword123', 
    role: role_enum.mahasiswa,
    judul: 'Judul TA mahasiswa 1',
    status_user: status_user_enum.active,
}

const testMahasiswa2 = {
    user_id: '2211522009',
    nama: 'ramadhani safitri',
    no_whatsapp: '081234567892',
    sandi: 'hashedpassword789',
    role: role_enum.mahasiswa,
    judul: 'Judul TA mahasiswa 2',
    status_user: status_user_enum.active,
}

const testMahasiswaInactive = {
    user_id: '2211522030',
    nama: 'muhammad zaki andafi',
    no_whatsapp: '081234567893',
    sandi: 'hashedpassword101',
    role: role_enum.mahasiswa,
    judul: 'Judul TA mahasiswa 3',
    status_user: status_user_enum.inactive,
}

const testDosen = {
    user_id: '0909090909', 
    nama: 'husnil kamil, MT',
    no_whatsapp: '081234567891',
    sandi: 'hashedpassword456',
    role: role_enum.dosen,
    status_user: status_user_enum.active,
}

const testDosenInactive = {
    user_id: '0808080808',
    nama: 'jefril rahmadoni, M.Kom',
    no_whatsapp: '081234567894',
    sandi: 'hashedpassword202',
    role: role_enum.dosen,
    status_user: status_user_enum.inactive,
}

const testBimbingan = {
    bimbingan_id: `${testDosen.user_id}-${testMahasiswa.user_id}`,
    dosen_id: testDosen.user_id,
    mahasiswa_id: testMahasiswa.user_id,
    status_bimbingan: status_bimbingan_enum.ongoing,
    total_bimbingan: 0
}

describe('BIMBINGAN system testing (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    
    beforeAll(async() => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        
        prisma = app.get<PrismaService>(PrismaService);
        
        await app.init();
    })
    
    beforeEach(async() => {
        await prisma.progress.deleteMany({});
        await prisma.jadwal.deleteMany({});
        await prisma.bimbingan.deleteMany({});
        await prisma.users.deleteMany({});
        
        await prisma.users.createMany({
            data: [testMahasiswa, testMahasiswa2, testMahasiswaInactive, testDosen, testDosenInactive]
        })
    })
    
    afterAll(async() => {
        await prisma.$disconnect()
        await app.close();
    })
    
    describe('GET /bimbingan/:dosen_id - mahasiswaDibimbing', () => {
        it('should return list mahasiswa yang dibimbing', async() => {
            await prisma.bimbingan.create({
                data: testBimbingan
            })
            
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/${testDosen.user_id}`)
            .expect(200)
            
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty('status_bimbingan', 'ongoing');
            expect(response.body[0].users_bimbingan_mahasiswa_idTousers).toMatchObject({
                user_id: testMahasiswa.user_id,
                nama: testMahasiswa.nama,
                judul: testMahasiswa.judul,
            })
        })
        
        it('should return multiple mahasiswa when dosen has multiple students', async() => {
            await prisma.bimbingan.createMany({
                data: [
                    testBimbingan,
                    {
                        bimbingan_id: `${testDosen.user_id}-${testMahasiswa2.user_id}`,
                        dosen_id: testDosen.user_id,
                        mahasiswa_id: testMahasiswa2.user_id,
                        status_bimbingan: status_bimbingan_enum.ongoing,
                        total_bimbingan: 0
                    }
                ]
            })
            
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/${testDosen.user_id}`)
            .expect(200)
            
            expect(response.body).toHaveLength(2);
        })
        
        it('should return empty array when dosen has no students', async() => {
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/${testDosen.user_id}`)
            .expect(200)
            
            expect(response.body).toHaveLength(0);
        })
        
        it('should return 404 when dosen does not exist', async() => {
            await request(app.getHttpServer())
            .get(`/bimbingan/99999999`)
            .expect(404)
        })
    })
    
    describe('POST /bimbingan/add - addMahasiswa', () => {
        it('should successfully add single mahasiswa to dosen', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: [testMahasiswa.user_id]
            }
            
            const response = await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(201)
            
            expect(response.body.success).toBe(true);
            
            const bimbingan = await prisma.bimbingan.findFirst({
                where: {
                    dosen_id: testDosen.user_id,
                    mahasiswa_id: testMahasiswa.user_id
                }
            })
            
            expect(bimbingan).toBeDefined();
            expect(bimbingan?.status_bimbingan).toBe(status_bimbingan_enum.ongoing);
            expect(bimbingan?.total_bimbingan).toBe(0);
        })
        
        it('should successfully add multiple mahasiswa to dosen', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: [testMahasiswa.user_id, testMahasiswa2.user_id]
            }
            
            const response = await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(201)
            
            expect(response.body.success).toBe(true);
            
            const bimbingan = await prisma.bimbingan.findMany({
                where: { dosen_id: testDosen.user_id }
            })
            
            expect(bimbingan).toHaveLength(2);
        })
        
        it('should return 400 when dosen_id is empty', async() => {
            const dto = {
                dosen_id: '   ',
                mahasiswa_id: [testMahasiswa.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 400 when mahasiswa_id array is empty', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: []
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 400 when mahasiswa_id contains only invalid values', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: ['', '   ', null]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 404 when dosen does not exist', async() => {
            const dto = {
                dosen_id: '99999999',
                mahasiswa_id: [testMahasiswa.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(404)
        })
        
        it('should return 400 when user is not dosen', async() => {
            const dto = {
                dosen_id: testMahasiswa.user_id,
                mahasiswa_id: [testMahasiswa2.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 400 when dosen is inactive', async() => {
            const dto = {
                dosen_id: testDosenInactive.user_id,
                mahasiswa_id: [testMahasiswa.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 404 when mahasiswa does not exist', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: ['88888888']
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(404)
        })
        
        it('should return 400 when user is not mahasiswa', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: [testDosenInactive.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 400 when mahasiswa is inactive', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: [testMahasiswaInactive.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(400)
        })
        
        it('should return 409 when mahasiswa already registered with dosen', async() => {
            await prisma.bimbingan.create({
                data: testBimbingan
            })
            
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: [testMahasiswa.user_id]
            }
            
            await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(409)
        })
        
        it('should handle duplicate mahasiswa_id in array', async() => {
            const dto = {
                dosen_id: testDosen.user_id,
                mahasiswa_id: [testMahasiswa.user_id, testMahasiswa.user_id, testMahasiswa.user_id]
            }
            
            const response = await request(app.getHttpServer())
            .post('/bimbingan/add')
            .send(dto)
            .expect(201)
            
            expect(response.body.success).toBe(true);
            
            const bimbingan = await prisma.bimbingan.findMany({
                where: { dosen_id: testDosen.user_id }
            })
            
            expect(bimbingan).toHaveLength(1);
        })
    })
    
    describe('GET /bimbingan/dospem/:mahasiswa_id - dosenPembimbing', () => {
        it('should return list of dosen pembimbing for mahasiswa', async() => {
            await prisma.bimbingan.create({
                data: testBimbingan
            })
            
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/dospem/${testMahasiswa.user_id}`)
            .expect(200)
            
            expect(response.body).toHaveLength(1);
            expect(response.body[0].users_bimbingan_dosen_idTousers).toMatchObject({
                nama: testDosen.nama
            })
        })
        
        it('should return empty array when mahasiswa has no dosen', async() => {
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/dospem/${testMahasiswa.user_id}`)
            .expect(200)
            
            expect(response.body).toHaveLength(0);
        })
         
        
        it('should return 404 when mahasiswa does not exist', async() => {
            await request(app.getHttpServer())
            .get(`/bimbingan/dospem/99999999`)
            .expect(404)
        })
        
        it('should return 400 when user is not mahasiswa', async() => {
            await request(app.getHttpServer())
            .get(`/bimbingan/dospem/${testDosen.user_id}`)
            .expect(400)
        })
    })
    
    describe('GET /bimbingan/jumlah/:dosen_id - jumlahMahasiswaBimbingan', () => {
        it('should return count of active mahasiswa bimbingan', async() => {
            await prisma.bimbingan.createMany({
                data: [
                    testBimbingan,
                    {
                        bimbingan_id: `${testDosen.user_id}-${testMahasiswa2.user_id}`,
                        dosen_id: testDosen.user_id,
                        mahasiswa_id: testMahasiswa2.user_id,
                        status_bimbingan: status_bimbingan_enum.ongoing,
                        total_bimbingan: 0
                    }
                ]
            })
            
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/jumlah/${testDosen.user_id}`)
            .expect(200)
            
            expect(Number(response.text)).toBe(2);
        })
        
        it('should exclude done status from count', async() => {
            await prisma.bimbingan.createMany({
                data: [
                    testBimbingan,
                    {
                        bimbingan_id: `${testDosen.user_id}-${testMahasiswa2.user_id}`,
                        dosen_id: testDosen.user_id,
                        mahasiswa_id: testMahasiswa2.user_id,
                        status_bimbingan: status_bimbingan_enum.done,
                        total_bimbingan: 5
                    }
                ]
            })
            
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/jumlah/${testDosen.user_id}`)
            .expect(200)
            
            expect(Number(response.text)).toBe(1);
        })
        
        it('should return 0 when dosen has no mahasiswa', async() => {
            const response = await request(app.getHttpServer())
            .get(`/bimbingan/jumlah/${testDosen.user_id}`)
            .expect(200)
            
            expect(Number(response.text)).toBe(0);
        })
        
        
        it('should return 404 when dosen does not exist', async() => {
            await request(app.getHttpServer())
            .get(`/bimbingan/jumlah/99999999`)
            .expect(404)
        })
        
        it('should return 400 when user is not dosen', async() => {
            await request(app.getHttpServer())
            .get(`/bimbingan/jumlah/${testMahasiswa.user_id}`)
            .expect(400)
        })
    })
    
    describe('DELETE /bimbingan/hapus/:dosen_id/:mahasiswa_id - hapusMahasiswaBimbingan', () => {
        it('should successfully delete bimbingan without related data', async() => {
            await prisma.bimbingan.create({
                data: testBimbingan
            })
            
            const response = await request(app.getHttpServer())
            .delete(`/bimbingan/hapus/${testDosen.user_id}/${testMahasiswa.user_id}`)
            .expect(200)
            
            expect(response.body.success).toBe(true);
            
            const bimbingan = await prisma.bimbingan.findFirst({
                where: {
                    dosen_id: testDosen.user_id,
                    mahasiswa_id: testMahasiswa.user_id
                }
            })
            
            expect(bimbingan).toBeNull();
        })
        
        it('should delete bimbingan with related progress and jadwal', async() => {
            await prisma.bimbingan.create({
                data: testBimbingan
            })
            
            const progressDate = new Date('2024-01-15T10:00:00Z');
            const submitDate = new Date('2024-01-15T09:00:00Z');
            
            await prisma.progress.create({
                data: {
                    progress_id: 'progress-1',
                    bimbingan_id: testBimbingan.bimbingan_id,
                    subject_progress: 'Test Progress',
                    file_progress: 'test-file.pdf',
                    submit_at: submitDate,
                    status_progress: status_progress_enum.unread,
                    jenis_bimbingan: jenis_bimbingan_enum.offline,
                    revisi_number: 0,
                    datetime: progressDate
                }
            })
            
            const jadwalDate = new Date('2024-01-20T14:00:00Z');
            
            await prisma.jadwal.create({
                data: {
                    bimbingan_id: testBimbingan.bimbingan_id,
                    datetime: jadwalDate,
                    lokasi: 'Ruang Dosen',
                    note_mahasiswa: 'Mohon bimbingan bab 1',
                    status_jadwal: status_jadwal_enum.waiting
                }
            })
            
            const response = await request(app.getHttpServer())
            .delete(`/bimbingan/hapus/${testDosen.user_id}/${testMahasiswa.user_id}`)
            .expect(200)
            
            expect(response.body.success).toBe(true);
            
            const [bimbingan, progress, jadwal] = await Promise.all([
                prisma.bimbingan.findFirst({
                    where: { bimbingan_id: testBimbingan.bimbingan_id }
                }),
                prisma.progress.findFirst({
                    where: { bimbingan_id: testBimbingan.bimbingan_id }
                }),
                prisma.jadwal.findFirst({
                    where: { bimbingan_id: testBimbingan.bimbingan_id }
                })
            ])
            
            expect(bimbingan).toBeNull();
            expect(progress).toBeNull();
            expect(jadwal).toBeNull();
        })
        
        
        it('should return 404 when dosen does not exist', async() => {
            await request(app.getHttpServer())
            .delete(`/bimbingan/hapus/99999999/${testMahasiswa.user_id}`)
            .expect(404)
        })
        
        it('should return 404 when mahasiswa does not exist', async() => {
            await request(app.getHttpServer())
            .delete(`/bimbingan/hapus/${testDosen.user_id}/99999999`)
            .expect(404)
        })
        
        it('should return 404 when bimbingan relationship does not exist', async() => {
            await request(app.getHttpServer())
            .delete(`/bimbingan/hapus/${testDosen.user_id}/${testMahasiswa.user_id}`)
            .expect(404)
        })
        
        it('should return 400 when trying to delete completed bimbingan', async() => {
            await prisma.bimbingan.create({
                data: {
                    ...testBimbingan,
                    status_bimbingan: status_bimbingan_enum.done
                }
            })
            
            await request(app.getHttpServer())
            .delete(`/bimbingan/hapus/${testDosen.user_id}/${testMahasiswa.user_id}`)
            .expect(400)
        })
    })
    
    describe('PATCH /bimbingan/selesai/:mahasiswa_id - selesaiBimbingan', () => {
        it('should successfully mark bimbingan as done', async() => {
            await prisma.bimbingan.create({
                data: testBimbingan
            })
            
            const response = await request(app.getHttpServer())
            .patch(`/bimbingan/selesai/${testMahasiswa.user_id}`)
            .expect(200)
            
            expect(response.body.success).toBe(true);
            
            const bimbingan = await prisma.bimbingan.findFirst({
                where: {
                    mahasiswa_id: testMahasiswa.user_id
                }
            })
            
            expect(bimbingan?.status_bimbingan).toBe(status_bimbingan_enum.done);
        })
        
        it('should mark all bimbingan as done for mahasiswa with multiple dosen', async() => {
            await prisma.bimbingan.createMany({
                data: [
                    testBimbingan,
                    {
                        bimbingan_id: `${testDosenInactive.user_id}-${testMahasiswa.user_id}`,
                        dosen_id: testDosenInactive.user_id,
                        mahasiswa_id: testMahasiswa.user_id,
                        status_bimbingan: status_bimbingan_enum.ongoing,
                        total_bimbingan: 0
                    }
                ]
            })
            
            const response = await request(app.getHttpServer())
            .patch(`/bimbingan/selesai/${testMahasiswa.user_id}`)
            .expect(200)
            
            expect(response.body.success).toBe(true);
            
            const bimbingan = await prisma.bimbingan.findMany({
                where: { mahasiswa_id: testMahasiswa.user_id }
            })
            
            expect(bimbingan).toHaveLength(2);
            expect(bimbingan.every(b => b.status_bimbingan === status_bimbingan_enum.done)).toBe(true);
        })
        
        
        it('should return 404 when mahasiswa does not exist', async() => {
            await request(app.getHttpServer())
            .patch(`/bimbingan/selesai/99999999`)
            .expect(404)
        })
        
        it('should return 400 when user is not mahasiswa', async() => {
            await request(app.getHttpServer())
            .patch(`/bimbingan/selesai/${testDosen.user_id}`)
            .expect(400)
        })
        
        it('should return 404 when mahasiswa has no active bimbingan', async() => {
            await request(app.getHttpServer())
            .patch(`/bimbingan/selesai/${testMahasiswa.user_id}`)
            .expect(404)
        })
        
        it('should return 404 when all bimbingan already done', async() => {
            await prisma.bimbingan.create({
                data: {
                    ...testBimbingan,
                    status_bimbingan: status_bimbingan_enum.done
                }
            })
            
            await request(app.getHttpServer())
            .patch(`/bimbingan/selesai/${testMahasiswa.user_id}`)
            .expect(404)
        })
    })
})