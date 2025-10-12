import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

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
                    tahun: true
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
}