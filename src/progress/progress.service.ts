import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { jenis_bimbingan_enum, status_progress_enum } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { SupabaseService } from "../supabase/supabase.service.js";
import { addProgressOnlineDto } from "./dto/add-progress.dto.js";

@Injectable()
export class ProgressService{
    constructor(
        private prisma: PrismaService,
        private supabaseService: SupabaseService
    ){}
    
    async addProgressOnline(dto: addProgressOnlineDto, mahasiswa_id: string, file: Express.Multer.File) {
        try {
            const idBimbinganList = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id,
                },
                select: {
                    bimbingan_id: true,
                },
            });
            
            if (idBimbinganList.length === 0) {
                throw new Error("Bimbingan tidak ditemukan untuk mahasiswa ini");
            }
            
            const { publicUrl, filename } = await this.supabaseService.uploadProgressFile(file);
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            
            const dataToInsert = idBimbinganList.map((item) => ({
                progress_id: uniqueId,
                bimbingan_id: item.bimbingan_id,
                subject_progress: dto.subject_progress,
                file_progress: publicUrl,
                file_name : filename,
                submit_at: new Date(),
                note_mahasiswa: dto.note_mahasiswa,
                status_progress: status_progress_enum.unread,
                jenis_bimbingan: jenis_bimbingan_enum.online,
                revisi_number: 0,
            }));
            
            const submit = await this.prisma.progress.createMany({
                data: dataToInsert,
                skipDuplicates: true,
            });
            
            return submit;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async allProgressOnline(mahasiswa_id: string) {
        try {
            const bimbinganId = await this.prisma.bimbingan.findFirst({
                where: {
                    mahasiswa_id: mahasiswa_id
                },
                select: {
                    bimbingan_id: true,
                }
            });
            
            if (!bimbinganId) {
                throw new Error('Bimbingan tidak ditemukan untuk mahasiswa ini');
            }
            
            const data = await this.prisma.progress.findMany({
                distinct: ['file_name'], 
                where: {
                    file_name: {
                        not: null,
                    },
                    jenis_bimbingan: 'online',
                    bimbingan_id: bimbinganId.bimbingan_id, 
                },
            });
            
            const all = data.map((item) => {
                const tanggalObj = new Date(item.submit_at);
                
                return {
                    judul: item.subject_progress,
                    tanggal: tanggalObj.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }),
                    jam: tanggalObj.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    namaFile: item.file_name,
                    pesan: item.note_mahasiswa,
                    status: item.status_progress,
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