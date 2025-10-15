import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseService } from "../supabase/supabase.service";

@Injectable()
export class ProfileService{
    constructor(
        private prisma: PrismaService,
        private supabase: SupabaseService
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

    async changePhoto(file: Express.Multer.File, user_id:string){
        try {
            const photo_url = await this.supabase.uploadPhoto(file);

            const change = await this.prisma.users.update({
                where: {
                    user_id: user_id
                }, data: {
                    photo_url: photo_url
                }
            })

            return change.photo_url;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }

    async getPhotoProfile(user_id:string){
        try {
            const photo_url = await this.prisma.users.findFirst({
                where: {
                    user_id: user_id
                }, select: {
                    photo_url: true
                }
            })

            return photo_url?.photo_url;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}