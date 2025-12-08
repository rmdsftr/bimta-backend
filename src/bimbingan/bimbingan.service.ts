import { 
    Injectable, 
    InternalServerErrorException, 
    NotFoundException,
    BadRequestException,
    ConflictException, 
    HttpException
} from "@nestjs/common";
import { status_bimbingan_enum } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AddMahasiswaBimbinganDto } from "./dto/add-mahasiswa.dto";

@Injectable()
export class BimbinganService {
    constructor(private prisma: PrismaService) {}
    
    async mahasiswaDibimbing(dosen_id: string) {
        try {
            
            const dosenExists = await this.prisma.users.findUnique({
                where: { user_id: dosen_id },
                select: { user_id: true }
            });

            if (!dosenExists) {
                throw new NotFoundException('Dosen tidak ditemukan');
            }

            const mahasiswa = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dosen_id
                },
                select: {
                    status_bimbingan: true,
                    users_bimbingan_mahasiswa_idTousers: {
                        select: {
                            user_id: true,
                            nama: true,
                            judul: true,
                            photo_url: true
                        }
                    }
                }
            });
            
            return mahasiswa;
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
    }
    
    async addMahasiswa(dto: AddMahasiswaBimbinganDto) {
        
        if (!dto.dosen_id?.trim()) {
            throw new BadRequestException('ID dosen tidak valid');
        }

        if (!dto.mahasiswa_id || !Array.isArray(dto.mahasiswa_id) || dto.mahasiswa_id.length === 0) {
            throw new BadRequestException('Daftar mahasiswa tidak boleh kosong');
        }

        
        const uniqueMahasiswaIds = [...new Set(
            dto.mahasiswa_id.filter(id => id && typeof id === 'string' && id.trim())
        )];

        if (uniqueMahasiswaIds.length === 0) {
            throw new BadRequestException('Tidak ada ID mahasiswa yang valid');
        }

        try {
            
            const dosen = await this.prisma.users.findUnique({
                where: { user_id: dto.dosen_id },
                select: { 
                    user_id: true,
                    role: true,
                    status_user: true
                }
            });

            if (!dosen) {
                throw new NotFoundException('Dosen tidak ditemukan');
            }

            if (dosen.role !== 'dosen') {
                throw new BadRequestException('User bukan dosen');
            }

            if (dosen.status_user !== 'active') {
                throw new BadRequestException('Dosen tidak aktif');
            }

            
            const mahasiswaList = await this.prisma.users.findMany({
                where: { 
                    user_id: { in: uniqueMahasiswaIds }
                },
                select: { 
                    user_id: true,
                    role: true,
                    status_user: true
                }
            });

            if (mahasiswaList.length !== uniqueMahasiswaIds.length) {
                const foundIds = mahasiswaList.map(m => m.user_id);
                const notFoundIds = uniqueMahasiswaIds.filter(id => !foundIds.includes(id));
                throw new NotFoundException(
                    `Mahasiswa tidak ditemukan: ${notFoundIds.join(', ')}`
                );
            }

            
            const nonMahasiswa = mahasiswaList.filter(m => m.role !== 'mahasiswa');
            if (nonMahasiswa.length > 0) {
                throw new BadRequestException(
                    `User bukan mahasiswa: ${nonMahasiswa.map(m => m.user_id).join(', ')}`
                );
            }

            
            const inactiveMahasiswa = mahasiswaList.filter(m => m.status_user !== 'active');
            if (inactiveMahasiswa.length > 0) {
                throw new BadRequestException(
                    `Mahasiswa tidak aktif: ${inactiveMahasiswa.map(m => m.user_id).join(', ')}`
                );
            }

            
            const existingBimbingan = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dto.dosen_id,
                    mahasiswa_id: { in: uniqueMahasiswaIds }
                },
                select: { 
                    mahasiswa_id: true,
                    status_bimbingan: true
                }
            });

            if (existingBimbingan.length > 0) {
                const existingIds = existingBimbingan.map(b => b.mahasiswa_id);
                throw new ConflictException(
                    `Mahasiswa sudah terdaftar dengan dosen ini: ${existingIds.join(', ')}`
                );
            }

            const dataToInsert = uniqueMahasiswaIds.map((mhsId) => ({
                bimbingan_id: `${dto.dosen_id}-${mhsId}`,
                dosen_id: dto.dosen_id,
                mahasiswa_id: mhsId,
                status_bimbingan: status_bimbingan_enum.ongoing,
                total_bimbingan: 0,
            }));
            
            await this.prisma.bimbingan.createMany({
                data: dataToInsert,
                skipDuplicates: true,
            });
            
            return { success: true };
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
    }
    
    async dosenPembimbing(mahasiswa_id: string) {
        
        if (!mahasiswa_id?.trim()) {
            throw new BadRequestException('ID mahasiswa tidak valid');
        }

        try {
            
            const mahasiswa = await this.prisma.users.findUnique({
                where: { user_id: mahasiswa_id },
                select: { 
                    user_id: true,
                    role: true
                }
            });

            if (!mahasiswa) {
                throw new NotFoundException('Mahasiswa tidak ditemukan');
            }

            if (mahasiswa.role !== 'mahasiswa') {
                throw new BadRequestException('User bukan mahasiswa');
            }

            const dosen = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id
                },
                select: {
                    users_bimbingan_dosen_idTousers: {
                        select: {
                            nama: true
                        }
                    }
                }
            });
            
            return dosen;
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
    }
    
    async jumlahMahasiswaBimbingan(dosen_id: string) {
        
        if (!dosen_id?.trim()) {
            throw new BadRequestException('ID dosen tidak valid');
        }

        try {
            
            const dosenExists = await this.prisma.users.findUnique({
                where: { user_id: dosen_id },
                select: { 
                    user_id: true,
                    role: true
                }
            });

            if (!dosenExists) {
                throw new NotFoundException('Dosen tidak ditemukan');
            }

            if (dosenExists.role !== 'dosen') {
                throw new BadRequestException('User bukan dosen');
            }

            const jumlah = await this.prisma.bimbingan.count({
                where: {
                    dosen_id: dosen_id,
                    NOT: {
                        status_bimbingan: status_bimbingan_enum.done,
                    },
                },
            });
            
            return jumlah;
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
    }
    
    async hapusMahasiswaBimbingan(dosen_id: string, mahasiswa_id: string) {
        
        if (!dosen_id?.trim() || !mahasiswa_id?.trim()) {
            throw new BadRequestException('ID dosen dan mahasiswa tidak valid');
        }

        try {
            
            const [dosenExists, mahasiswaExists] = await Promise.all([
                this.prisma.users.findUnique({
                    where: { user_id: dosen_id },
                    select: { user_id: true }
                }),
                this.prisma.users.findUnique({
                    where: { user_id: mahasiswa_id },
                    select: { user_id: true }
                })
            ]);

            if (!dosenExists) {
                throw new NotFoundException('Dosen tidak ditemukan');
            }

            if (!mahasiswaExists) {
                throw new NotFoundException('Mahasiswa tidak ditemukan');
            }

            const bimbingan = await this.prisma.bimbingan.findFirst({
                where: {
                    dosen_id,
                    mahasiswa_id
                },
                select: {
                    bimbingan_id: true,
                    status_bimbingan: true
                }
            });
            
            if (!bimbingan) {
                throw new NotFoundException('Data bimbingan tidak ditemukan');
            }

            
            if (bimbingan.status_bimbingan === status_bimbingan_enum.done) {
                throw new BadRequestException('Tidak dapat menghapus bimbingan yang sudah selesai');
            }

            const { bimbingan_id } = bimbingan;

            
            const [progressCount, jadwalCount] = await Promise.all([
                this.prisma.progress.count({
                    where: { bimbingan_id }
                }),
                this.prisma.jadwal.count({
                    where: { bimbingan_id }
                })
            ]);

            
            if (progressCount > 0 || jadwalCount > 0) {
                
                await this.prisma.$transaction([
                    this.prisma.progress.deleteMany({
                        where: { bimbingan_id }
                    }),
                    this.prisma.jadwal.deleteMany({
                        where: { bimbingan_id }
                    }),
                    this.prisma.bimbingan.delete({
                        where: { bimbingan_id }
                    }),
                ]);
            } else {
                
                await this.prisma.bimbingan.delete({
                    where: { bimbingan_id }
                });
            }
            
            return { success : true}
        } catch (error) {
            console.error(error);
            if (
                error instanceof NotFoundException || 
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
    }
    
    async selesaiBimbingan(mahasiswa_id: string) {
        
        if (!mahasiswa_id?.trim()) {
            throw new BadRequestException('ID mahasiswa tidak valid');
        }

        try {
            
            const mahasiswa = await this.prisma.users.findUnique({
                where: { user_id: mahasiswa_id },
                select: { 
                    user_id: true,
                    role: true
                }
            });

            if (!mahasiswa) {
                throw new NotFoundException('Mahasiswa tidak ditemukan');
            }

            if (mahasiswa.role !== 'mahasiswa') {
                throw new BadRequestException('User bukan mahasiswa');
            }

            
            const bimbinganId = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id,
                    NOT: {
                        status_bimbingan: status_bimbingan_enum.done
                    }
                },
                select: {
                    bimbingan_id: true,
                    status_bimbingan: true
                }
            });

            if (bimbinganId.length === 0) {
                throw new NotFoundException('Tidak ada bimbingan aktif untuk diselesaikan');
            }
            
            const ids = bimbinganId.map((item) => item.bimbingan_id);
            
            await this.prisma.bimbingan.updateMany({
                where: {
                    bimbingan_id: {
                        in: ids
                    }
                },
                data: {
                    status_bimbingan: status_bimbingan_enum.done
                }
            });

            return { success: true };
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
    }
}