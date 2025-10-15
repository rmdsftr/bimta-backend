import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddJadwalDto } from "./dto/add-jadwal.dto";
import { status_jadwal_enum } from "@prisma/client";

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
                    status_jadwal: true
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
                    status: item.status_jadwal
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
    
}