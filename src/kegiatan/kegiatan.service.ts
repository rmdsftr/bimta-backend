import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddKegiatanDto } from "./dto/add-kegiatan.dto";

@Injectable()
export class KegiatanService {
    constructor(
        private prisma: PrismaService
    ) {}
    
    async addKegiatan(dosen_id: string, dto: AddKegiatanDto) {
        try {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            
            const jamMulai = new Date(`1970-01-01T${dto.jam_mulai}:00Z`);
            const jamSelesai = new Date(`1970-01-01T${dto.jam_selesai}:00Z`);
            
            const add = await this.prisma.jadwal_dosen.create({
                data: {
                    jadwal_dosen_id: uniqueId,
                    dosen_id: dosen_id,
                    kegiatan: dto.kegiatan,
                    tanggal: new Date(dto.tanggal),      
                    jam_mulai: jamMulai,
                    jam_selesai: jamSelesai,
                }
            });
            
            return add;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Terjadi kesalahan saat menyimpan kegiatan');
        }
    }

    async getKegiatanByMonth(dosen_id: string, year: number, month: number) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const kegiatan = await this.prisma.jadwal_dosen.findMany({
                where: {
                    dosen_id: dosen_id,
                    tanggal: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: {
                    tanggal: 'asc'
                }
            });

            return kegiatan;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Terjadi kesalahan saat mengambil data kegiatan');
        }
    }

    async getKegiatanByDate(dosen_id: string, date: string) {
        try {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const kegiatan = await this.prisma.jadwal_dosen.findMany({
                where: {
                    dosen_id: dosen_id,
                    tanggal: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                orderBy: {
                    jam_mulai: 'asc'
                }
            });

            return kegiatan;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Terjadi kesalahan saat mengambil data kegiatan');
        }
    }

    async deleteKegiatan(jadwal_dosen_id: string) {
        try {
            const kegiatan = await this.prisma.jadwal_dosen.findUnique({
                where: {
                    jadwal_dosen_id: jadwal_dosen_id
                }
            });

            if (!kegiatan) {
                throw new NotFoundException('Kegiatan tidak ditemukan');
            }

            await this.prisma.jadwal_dosen.delete({
                where: {
                    jadwal_dosen_id: jadwal_dosen_id
                }
            });

            return {
                message: 'Kegiatan berhasil dihapus',
                jadwal_dosen_id: jadwal_dosen_id
            };
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Terjadi kesalahan saat menghapus kegiatan');
        }
    }

    async getKegiatanByBulan(mahasiswa_id: string, year: number, month: number) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const dosen_id = await this.prisma.bimbingan.findFirst({
                where: {
                    mahasiswa_id: mahasiswa_id
                }, select: {
                    dosen_id: true
                }
            })

            const kegiatan = await this.prisma.jadwal_dosen.findMany({
                where: {
                    dosen_id: dosen_id!.dosen_id,
                    tanggal: {
                        gte: startDate,
                        lte: endDate
                    }
                }, select: {
                    kegiatan: true,
                    jam_mulai: true,
                    jam_selesai: true,
                    tanggal: true
                },
                orderBy: {
                    tanggal: 'asc'
                }
            });

            return kegiatan;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Terjadi kesalahan saat mengambil data kegiatan');
        }
    }

    async getKegiatanByTahun(mahasiswa_id: string, date: string) {
        try {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const dosen_id = await this.prisma.bimbingan.findFirst({
                where: {
                    mahasiswa_id: mahasiswa_id
                }, select: {
                    dosen_id: true
                }
            })

            const kegiatan = await this.prisma.jadwal_dosen.findMany({
                where: {
                    dosen_id: dosen_id!.dosen_id,
                    tanggal: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }, select: {
                    kegiatan: true,
                    jam_mulai: true,
                    jam_selesai: true,
                    tanggal: true
                },
                orderBy: {
                    jam_mulai: 'asc'
                }
            });

            return kegiatan;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Terjadi kesalahan saat mengambil data kegiatan');
        }
    }
}