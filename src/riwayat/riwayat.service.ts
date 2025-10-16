import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { jenis_bimbingan_enum, status_jadwal_enum, status_progress_enum } from "@prisma/client";

@Injectable()
export class RiwayatService{
    constructor(
        private prisma: PrismaService
    ){}

    async riwayatBimbingan(mahasiswa_id:string){
        try {
            const bimbinganId = await this.prisma.bimbingan.findFirst({
                where: {
                    mahasiswa_id: mahasiswa_id
                }, select: {
                    bimbingan_id: true
                }
            });

            const offline = await this.prisma.jadwal.findMany({
                where: {
                    bimbingan_id : bimbinganId?.bimbingan_id,
                    status_jadwal: status_jadwal_enum.done
                }, select: {
                    datetime: true,
                    judul_pertemuan: true,
                    note_dosen: true,
                    bimbingan_id: true
                }
            })

            const dataOffline = offline.map((item) => ({
                id: item.bimbingan_id,
                tanggal: item.datetime,
                pembahasan: item.judul_pertemuan,
                hasil: item.note_dosen,
                jenis: jenis_bimbingan_enum.offline
            }))

            const online = await this.prisma.progress.findMany({
                where: {
                    bimbingan_id: bimbinganId?.bimbingan_id,
                    status_progress: status_progress_enum.done,
                }, select: {
                    submit_at: true,
                    subject_progress: true,
                    evaluasi_dosen: true,
                    progress_id: true
                }
            });

            const dataOnline = online.map((item) => ({
                id: item.progress_id,
                tanggal : item.submit_at,
                pembahasan : item.subject_progress,
                hasil : item.evaluasi_dosen,
                jenis : jenis_bimbingan_enum.online
            }))

            const riwayatBimbingan = [...dataOffline, ...dataOnline].sort(
            (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
            );

            return riwayatBimbingan;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}