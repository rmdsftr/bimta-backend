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
                throw new NotFoundException("Bimbingan tidak ditemukan untuk mahasiswa ini"); // ✅ Change to NotFoundException
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
            // ✅ Check for HTTP exceptions first
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
                throw new NotFoundException('Bimbingan tidak ditemukan untuk mahasiswa ini'); // ✅ Change to NotFoundException
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
            // ✅ Check for HTTP exceptions first
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
                    subject_progress: true,
                    note_mahasiswa: true,
                    file_name: true,
                    file_progress: true,
                    status_progress: true,
                    bimbingan: {
                        select: {
                            users_bimbingan_mahasiswa_idTousers: {
                                select: {
                                    user_id: true,
                                    nama: true,
                                },
                            },
                        },
                    },
                },
            });
            
            const data = progress.map((item) => ({
                nama: item.bimbingan.users_bimbingan_mahasiswa_idTousers.nama,
                nim: item.bimbingan.users_bimbingan_mahasiswa_idTousers.user_id,
                judul: item.subject_progress,
                pesan : item.note_mahasiswa,
                status: item.status_progress,
                file_name: item.file_name,
                file_url: item.file_progress
            }))

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

            return { count: pending }; // ✅ Return object instead of plain number
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
            const progress = await this.prisma.progress.findUnique({
                where: { progress_id }
            });

            if (!progress) {
                throw new NotFoundException('Progress tidak ditemukan');
            }

            if (progress.status_progress === 'unread') {
                await this.prisma.progress.update({
                    where: { progress_id },
                    data: {
                        status_progress: 'read'
                    }
                });

                return {
                    status: 'success',
                    message: 'Status progress berhasil diubah menjadi read'
                };
            }

            return {
                status: 'success',
                message: 'Status progress sudah read'
            };

        } catch (error) {
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
                throw new NotFoundException('Progress tidak ditemukan');
            }

            if (dto.status_progress === 'need_revision' && !file) {
                throw new BadRequestException('File koreksi wajib diupload untuk status revisi');
            }

            let fileKoreksiUrl = progress.file_koreksi;

            if (file) {
                const uploadResult = await this.supabaseService.uploadProgressFile(file, 'koreksi');
                fileKoreksiUrl = uploadResult.publicUrl;
            }

            const updatedProgress = await this.prisma.progress.update({
                where: { progress_id },
                data: {
                    evaluasi_dosen: dto.evaluasi_dosen,
                    status_progress: dto.status_progress,
                    file_koreksi: fileKoreksiUrl,
                    koreksi_at: new Date()
                }
            });

            if (dto.status_progress === 'need_revision') {
                const timestamp = Date.now();
                const newProgressId = `PROG-${progress.bimbingan.mahasiswa_id}-${timestamp}`;

                await this.prisma.progress.create({
                    data: {
                        progress_id: newProgressId,
                        bimbingan_id: progress.bimbingan_id,
                        subject_progress: `Revisi ${progress.revisi_number + 1}: ${progress.subject_progress}`,
                        file_progress: progress.file_progress,
                        file_name: progress.file_name,
                        submit_at: new Date(),
                        status_progress: 'unread',
                        jenis_bimbingan: 'online',
                        revisi_number: progress.revisi_number + 1,
                        parent_progress_id: progress_id
                    }
                });
            }

            return {
                status: 'success',
                message: dto.status_progress === 'done' 
                    ? 'Progress berhasil disetujui' 
                    : 'Koreksi berhasil dikirim',
                data: updatedProgress
            };

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Gagal mengirim koreksi: ${error.message}`);
        }
    }
}