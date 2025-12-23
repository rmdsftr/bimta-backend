import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { jenis_bimbingan_enum, status_progress_enum } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseService } from "../supabase/supabase.service";
import { addProgressOnlineDto } from "./dto/add-progress.dto";
import { KoreksiProgressDto } from "./dto/koreksi-progress.dto";

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
                throw new NotFoundException("Bimbingan tidak ditemukan untuk mahasiswa ini"); 
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
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
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
                throw new NotFoundException('Bimbingan tidak ditemukan untuk mahasiswa ini'); 
            }
            
            const data = await this.prisma.progress.findMany({
                distinct: ['file_name'], 
                select: {
                    file_progress: true,
                    submit_at: true,
                    subject_progress: true,
                    file_name: true,
                    note_mahasiswa: true,
                    status_progress: true,
                    evaluasi_dosen: true,
                    file_koreksi: true
                },
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
                    file_url: item.file_progress,
                    evaluasi_dosen : item.evaluasi_dosen,
                    file_koreksi: item.file_koreksi
                };
            });
            
            return all;
        } catch (error) {
            console.error(error);
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async progressOnlineMahasiswa(dosen_id:string){
        try {
            const bimbinganList = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dosen_id,
                },
            });
            
            const progress = await this.prisma.progress.findMany({
                where: {
                    jenis_bimbingan: 'online',
                    bimbingan_id: {
                        in: bimbinganList.map((item) => item.bimbingan_id),
                    },
                },
                select: {
                    progress_id: true, 
                    subject_progress: true,
                    note_mahasiswa: true,
                    file_name: true,
                    file_progress: true,
                    status_progress: true,
                    submit_at: true, 
                    evaluasi_dosen: true, 
                    file_koreksi: true, 
                    koreksi_at: true, 
                    bimbingan: {
                        select: {
                            users_bimbingan_mahasiswa_idTousers: {
                                select: {
                                    user_id: true,
                                    nama: true,
                                    photo_url: true
                                },
                            },
                        },
                    },
                },
            });
            
            const data = progress.map((item) => ({
                progress_id: item.progress_id, 
                nama: item.bimbingan.users_bimbingan_mahasiswa_idTousers.nama,
                nim: item.bimbingan.users_bimbingan_mahasiswa_idTousers.user_id,
                photo_url: item.bimbingan.users_bimbingan_mahasiswa_idTousers.photo_url,
                judul: item.subject_progress,
                pesan: item.note_mahasiswa,
                status: item.status_progress,
                file_name: item.file_name,
                file_url: item.file_progress,
                submit_at: item.submit_at, 
                evaluasi_dosen: item.evaluasi_dosen, 
                file_koreksi: item.file_koreksi, 
                koreksi_at: item.koreksi_at, 
            }));
            
            return data;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async hitungPendingReview(dosen_id:string){
        try {
            const bimbingan = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dosen_id
                }, select: {
                    bimbingan_id: true
                }
            });
            
            const pending = await this.prisma.progress.count({
                where: {
                    status_progress: {
                        not: 'done'
                    },
                    jenis_bimbingan: 'online',
                    bimbingan_id: {
                        in: bimbingan.map((item) => item.bimbingan_id)
                    }
                }
            })
            
            return { count: pending }; 
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async markAsRead(progress_id: string) {
        try {
            console.log('🔍 Attempting to mark as read:', progress_id);
            
            const progress = await this.prisma.progress.findUnique({
                where: { progress_id }
            });
            
            console.log('📊 Found progress:', progress);
            
            if (!progress) {
                throw new NotFoundException(`Progress dengan ID ${progress_id} tidak ditemukan`);
            }
            
            
            if (progress.status_progress === 'unread') {
                const updated = await this.prisma.progress.update({
                    where: { progress_id },
                    data: {
                        status_progress: 'read'
                    }
                });
                
                console.log('✅ Successfully updated to read:', updated);
                
                return {
                    status: 'success',
                    message: 'Status progress berhasil diubah menjadi read',
                    data: updated
                };
            }
            
            return {
                status: 'success',
                message: 'Status progress sudah read',
                data: progress
            };
            
        } catch (error) {
            console.error('❌ Error in markAsRead:', error);
            
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new BadRequestException(`Gagal mengubah status: ${error.message}`);
        }
    }
    
    async submitKoreksi(
        progress_id: string,
        dto: KoreksiProgressDto,
        file?: Express.Multer.File
    ) {
        try {
            console.log('🔍 Submitting koreksi for:', progress_id);
            console.log('📝 DTO:', dto);
            console.log('📎 File:', file ? file.originalname : 'No file');
            
            const progress = await this.prisma.progress.findUnique({
                where: { progress_id },
                include: {
                    bimbingan: {
                        include: {
                            users_bimbingan_mahasiswa_idTousers: true
                        }
                    }
                }
            });
            
            if (!progress) {
                throw new NotFoundException(`Progress dengan ID ${progress_id} tidak ditemukan`);
            }
            
            
            if (dto.status_progress === 'need_revision' && !file) {
                throw new BadRequestException('File koreksi wajib diupload untuk status revisi');
            }
            
            let fileKoreksiUrl = progress.file_koreksi;
            
            
            if (file) {
                console.log('📤 Uploading koreksi file...');
                const uploadResult = await this.supabaseService.uploadProgressFile(file, 'koreksi');
                fileKoreksiUrl = uploadResult.publicUrl;
                console.log('✅ File uploaded:', uploadResult.publicUrl);
            }
            
            
            const updatedProgress = await this.prisma.progress.update({
                where: { progress_id },
                data: {
                    evaluasi_dosen: dto.evaluasi_dosen,
                    status_progress: status_progress_enum.done,
                    file_koreksi: fileKoreksiUrl,
                    koreksi_at: new Date()
                }
            });
            
            console.log('✅ Progress updated:', updatedProgress);
            
            return {
                status: 'success',
                message: dto.status_progress === 'done' 
                ? 'Progress berhasil disetujui' 
                : 'Koreksi berhasil dikirim, mahasiswa perlu merevisi',
                data: updatedProgress
            };
            
        } catch (error) {
            console.error('❌ Error in submitKoreksi:', error);
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException(`Gagal mengirim koreksi: ${error.message}`);
        }
    }
}