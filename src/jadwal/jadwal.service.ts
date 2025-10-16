import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddJadwalDto } from "./dto/add-jadwal.dto";
import { status_jadwal_enum } from "@prisma/client";
import { ResponseJadwal } from "./dto/accepted-jadwal.dto";

@Injectable()
export class JadwalService{
    constructor(
        private prisma: PrismaService
    ){}
    
    async addJadwal(dto: AddJadwalDto, mahasiswa_id: string) {
        try {
            const bimbinganList = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id,
                },
                select: {
                    bimbingan_id: true,
                },
            });
            
            if (bimbinganList.length === 0) {
                throw new NotFoundException('Bimbingan tidak ditemukan untuk mahasiswa ini');
            }
            
            const jadwalData = bimbinganList.map((item) => ({
                bimbingan_id: item.bimbingan_id,
                judul_pertemuan: dto.judul,
                datetime: new Date(`${dto.tanggal}T${dto.waktu}`), 
                lokasi: dto.lokasi,
                note_mahasiswa: dto.pesan,
                status_jadwal: status_jadwal_enum.waiting,
            }));
            
            const result = await this.prisma.jadwal.createMany({
                data: jadwalData,
            });
            
            return result;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async viewJadwal(mahasiswa_id:string){
        try {
            const bimbinganId = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id
                }
            });
            
            const bimbinganList = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id,
                },
                select: {
                    bimbingan_id: true,
                },
            });
            
            if (bimbinganList.length === 0) {
                throw new NotFoundException('Bimbingan tidak ditemukan untuk mahasiswa ini');
            }
            
            const jadwal = await this.prisma.jadwal.findMany({
                where: {
                    bimbingan_id: {
                        in: bimbinganId.map((item) => item.bimbingan_id)
                    }
                }, select: {
                    bimbingan_id: true,
                    judul_pertemuan: true,
                    datetime: true,
                    lokasi: true,
                    note_mahasiswa: true,
                    status_jadwal: true,
                    note_dosen: true
                }
            });
            
            const all = jadwal.map((item) => {
                const datetime = new Date(item.datetime);
                
                return {
                    subjek: item.judul_pertemuan,
                    tanggal: datetime.toISOString().split('T')[0], 
                    waktu: datetime.toTimeString().split(' ')[0], 
                    lokasi: item.lokasi,
                    pesan: item.note_mahasiswa,
                    status: item.status_jadwal,
                    pesanDosen: item.note_dosen
                };
            });
            
            return all;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async getJadwalDosen(dosen_id:string){
        try {
            const bimbinganId = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dosen_id
                }, select: {
                    bimbingan_id: true
                }
            });
            
            const bimbingan = await this.prisma.jadwal.findMany({
                where: {
                    bimbingan_id: {
                        in: bimbinganId.map((item) => item.bimbingan_id)
                    }
                }, select: {
                    bimbingan_id: true,
                    bimbingan: {
                        select: {
                            mahasiswa_id: true,
                            users_bimbingan_mahasiswa_idTousers: {
                                select: {
                                    nama: true,
                                    photo_url: true
                                }
                            },
                        }
                    },
                    judul_pertemuan: true,
                    datetime: true,
                    lokasi: true,
                    note_mahasiswa: true,
                    status_jadwal: true,
                    note_dosen: true
                }
            });
            
            const all = bimbingan.map((item) => {
                const datetime = new Date(item.datetime);
                
                const tanggal = datetime.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                const waktu = datetime.toTimeString().split(' ')[0].slice(0, 5); // Format: HH:MM
                
                return {
                    bimbingan_id: item.bimbingan_id,
                    datetime: new Date(item.datetime),
                    nama: item.bimbingan.users_bimbingan_mahasiswa_idTousers.nama,
                    nim: item.bimbingan.mahasiswa_id,
                    photo_url: item.bimbingan.users_bimbingan_mahasiswa_idTousers.photo_url,
                    tanggal: tanggal,
                    waktu: waktu,
                    lokasi: item.lokasi,
                    topik: item.judul_pertemuan,
                    pesan: item.note_mahasiswa,
                    status: item.status_jadwal,
                    pesanDosen: item.note_dosen
                };
            });
            
            
            return all;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async acceptedJadwal(bimbingan_id:string, datetime:string, dto: ResponseJadwal){
        try {
            await this.prisma.jadwal.update({
                where: {
                    bimbingan_id_datetime: {
                        bimbingan_id: bimbingan_id,
                        datetime: new Date(datetime)
                    }
                }, data: {
                    note_dosen: dto.note_dosen,
                    status_jadwal: status_jadwal_enum.accepted
                }
            })

            return {message: 'Bimbingan offline disetujui'}
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }

    async declinedJadwal(bimbingan_id:string, datetime:string, dto: ResponseJadwal){
        try {
            await this.prisma.jadwal.update({
                where: {
                    bimbingan_id_datetime: {
                        bimbingan_id: bimbingan_id,
                        datetime: new Date(datetime)
                    }
                }, data: {
                    note_dosen: dto.note_dosen,
                    status_jadwal: status_jadwal_enum.declined
                }
            })

            return {message: 'Bimbingan offline ditolak'}
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }

    async cancelJadwal(bimbingan_id:string, datetime:string, dto: ResponseJadwal){
        try {
            await this.prisma.jadwal.update({
                where: {
                    bimbingan_id_datetime: {
                        bimbingan_id: bimbingan_id,
                        datetime: new Date(datetime)
                    }
                }, data: {
                    note_dosen: dto.note_dosen,
                    status_jadwal: status_jadwal_enum.declined
                }
            })

            return {message: 'Bimbingan offline dibatalkan'}
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }

    async doneJadwal(bimbingan_id:string, datetime:string, dto: ResponseJadwal){
        try {
            await this.prisma.jadwal.update({
                where: {
                    bimbingan_id_datetime: {
                        bimbingan_id: bimbingan_id,
                        datetime: new Date(datetime)
                    }
                }, data: {
                    note_dosen: dto.note_dosen,
                    status_jadwal: status_jadwal_enum.done
                }
            })

            return {message: 'Bimbingan offline selesai'}
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}