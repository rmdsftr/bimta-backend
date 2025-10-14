import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProfileService{
    constructor(
        private prisma: PrismaService
    ){}
    
    async viewProfileMahasiswa(mahasiswa_id:string){
        try {
            const mahasiswa = await this.prisma.users.findFirst({
                where: {
                    user_id: mahasiswa_id
                }, select: {
                    user_id: true,
                    nama: true,
                    judul: true
                }
            })
            
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