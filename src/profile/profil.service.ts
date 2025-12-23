import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseService } from "../supabase/supabase.service";
import { ChangePasswordDto } from "./dto/changepassword.dto";
import * as bcrypt from 'bcrypt';
import { ChangeNumberDto } from "./dto/changenumber.dto";
import { GantiJudulDto } from "./dto/changejudul.dto";

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
                    judul: true,
                    photo_url: true, 
                    judul_temp: true, 
                    bimbingan_bimbingan_mahasiswa_idTousers: {
                        select: {
                            status_bimbingan: true
                        }
                    }
                }
            })
            
            const data = {
                user_id: mahasiswa?.user_id,
                nama: mahasiswa?.nama,
                judul: mahasiswa?.judul,
                photo_url: mahasiswa?.photo_url,
                judul_temp: mahasiswa?.judul_temp,
                status_bimbingan: mahasiswa?.bimbingan_bimbingan_mahasiswa_idTousers.flatMap((item) => item.status_bimbingan)
            }
            
            return data;
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
            
            await this.prisma.users.update({
                where: {
                    user_id: user_id
                }, data: {
                    photo_url: photo_url
                }
            })
            
            return { url: photo_url }; 
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
            const result = await this.prisma.users.findFirst({
                where: {
                    user_id: user_id
                }, select: {
                    photo_url: true
                }
            })
            
            return { url: result?.photo_url || null }; 
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async changePasswordUser(user_id:string, dto:ChangePasswordDto){
        try {
            const sandiLama = await this.prisma.users.findFirst({
                where: {
                    user_id: user_id
                }, select: {
                    sandi: true
                }
            })
            
            const isMatch = await bcrypt.compare(dto.sandiLama, sandiLama!.sandi)
            if(!isMatch){
                throw new BadRequestException("Sandi lama tidak cocok")
            }
            
            if(dto.sandiBaru != dto.konfirmasiSandi){
                throw new BadRequestException("Sandi baru dan konfirmasi tidak sesuai")
            }
            
            const hashPassword = await bcrypt.hash(dto.sandiBaru, 12);
            
            await this.prisma.users.update({
                where: {
                    user_id: user_id
                }, data: {
                    sandi: hashPassword
                }
            })
            
            return {message: 'Password berhasil diubah'}
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async changenNumberUser (user_id:string, dto:ChangeNumberDto){
        try {
            await this.prisma.users.update({
                where: {
                    user_id: user_id,
                }, data: {
                    no_whatsapp: dto.nomorBaru
                }
            })
            
            return {message: 'Nomor whatsapp berhasil diubah'}
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async getInfoMahasiswa(mahasiswa_id:string){
        try {
            const info = await this.prisma.users.findFirst({
                where: {
                    user_id: mahasiswa_id
                }, select: {
                    judul: true,
                    no_whatsapp: true
                }
            })
            
            return info;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async gantiJudul(mahasiswa_id: string, dto: GantiJudulDto) {
        try {
            
            const bimbingan = await this.prisma.bimbingan.findFirst({
                where: {
                    mahasiswa_id: mahasiswa_id
                }
            });
            
            
            if (!bimbingan) {
                throw new BadRequestException(
                    'Tidak dapat mengajukan ganti judul. Anda belum memiliki dosen pembimbing'
                );
            }
            
            
            await this.prisma.users.update({
                where: {
                    user_id: mahasiswa_id
                },
                data: {
                    judul_temp: dto.judulBaru
                }
            });
            
            return {
                message: 'Pengajuan ganti judul berhasil. Menunggu persetujuan dosen pembimbing'
            };
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async accGantiJudul(mahasiswa_id:string){
        try {
            const judul = await this.prisma.users.findFirst({
                where: {
                    user_id: mahasiswa_id
                }, select: {
                    judul: true,
                    judul_temp: true
                }
            });
            
            await this.prisma.users.update({
                where: {
                    user_id: mahasiswa_id
                }, data: {
                    judul: judul?.judul_temp,
                    judul_temp: ''
                }
            })
            
            return true;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async rejectGantiJudul(mahasiswa_id:string){
        await this.prisma.users.update({
            where: { user_id: mahasiswa_id },
            data: { judul_temp: '' }
        })
        return true;
    }
}