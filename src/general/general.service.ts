import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { status_jadwal_enum, status_progress_enum } from "@prisma/client";

@Injectable()
export class GeneralService{
    constructor(
        private prisma: PrismaService
    ){}
    
    async referensiTa(){
        try {
            const referensi = await this.prisma.referensi_ta.findMany({
                select: {
                    nim_mahasiswa: true,
                    nama_mahasiswa: true,
                    topik: true,
                    judul: true,
                    tahun: true,
                    doc_url: true
                }
            });
            
            return referensi;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async mahasiswa(dosen_id:string){
        try {
            const mahasiswa = await this.prisma.users.findMany({
                where: {
                    role: 'mahasiswa',
                    NOT: {
                        bimbingan_bimbingan_mahasiswa_idTousers: {
                            some: {
                                dosen_id: dosen_id 
                            }
                        }
                    }
                }, select: {
                    user_id: true,
                    nama: true
                },
            });
            
            return mahasiswa;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async terkiniMahasiswa(mahasiswa_id: string) {
        try {
            const bimbinganId = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id
                },
                select: {
                    bimbingan_id: true
                }
            });
            
            const progress = await this.prisma.progress.findMany({
                where: {
                    bimbingan_id: {
                        in: bimbinganId.map((item) => item.bimbingan_id)
                    },
                    status_progress: status_progress_enum.need_revision
                },
                select: {
                    subject_progress: true,
                    koreksi_at: true,
                    progress_id: true
                }
            });
            
            const jadwal = await this.prisma.jadwal.findMany({
                where: {
                    bimbingan_id: {
                        in: bimbinganId.map((item) => item.bimbingan_id)
                    },
                    status_jadwal: status_jadwal_enum.accepted
                },
                select: {
                    judul_pertemuan: true,
                    datetime: true,
                    bimbingan_id: true
                }
            });
            
            const dataProgress = progress.map((item) => ({
                progress_id: item.progress_id,
                nama: item.subject_progress,
                tanggal: item.koreksi_at,
                icon: 'progress'
            }));
            
            const dataJadwal = jadwal.map((item) => ({
                bimbingan_id: item.bimbingan_id,
                nama: item.judul_pertemuan,
                tanggal: item.datetime,
                icon: 'jadwal'
            }));
            
            const aktivitasGabungan = [...dataProgress, ...dataJadwal];
            
            const aktivitasTerkini = aktivitasGabungan.sort((a, b) =>
                new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()
        );
        
        return aktivitasTerkini;
    } catch (error) {
        console.error(error);
        if (!(error instanceof Error)) {
            throw new InternalServerErrorException('Terjadi kesalahan pada server');
        }
        throw error;
    }
}

    async terkiniDosen(dosen_id: string) {
        try {
            const bimbinganId = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dosen_id
                },
                select: {
                    bimbingan_id: true
                }
            });
            
            const progress = await this.prisma.progress.findMany({
                where: {
                    bimbingan_id: {
                        in: bimbinganId.map((item) => item.bimbingan_id)
                    },
                    status_progress: {
                        in: [status_progress_enum.unread, status_progress_enum.read]
                    }
                },
                select: {
                    subject_progress: true,
                    submit_at: true,
                    progress_id: true
                }
            });
            
            const dataProgress = progress.map((item) => ({
                progress_id: item.progress_id,
                nama: item.subject_progress,
                tanggal: item.submit_at,
                icon: 'progress'
            }));
            
            const jadwal = await this.prisma.jadwal.findMany({
                where: {
                    bimbingan_id: {
                        in: bimbinganId.map((item) => item.bimbingan_id)
                    },
                    status_jadwal: {
                        in: [status_jadwal_enum.waiting, status_jadwal_enum.accepted]
                    }
                },
                select: {
                    judul_pertemuan: true,
                    datetime: true,
                    bimbingan_id: true
                }
            });
            
            const dataJadwal = jadwal.map((item) => ({
                bimbingan_id: item.bimbingan_id,
                nama: item.judul_pertemuan,
                tanggal: item.datetime,
                icon: 'jadwal'
            }));
            
            const aktivitasGabungan = [...dataProgress, ...dataJadwal];
            
            const aktivitasTerkini = aktivitasGabungan.sort((a, b) =>
                new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()
            );

            return aktivitasTerkini;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}