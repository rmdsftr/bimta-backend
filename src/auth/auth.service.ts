import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt';
import { toTitleCase } from "../utils/word_case";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService{
    constructor(
        private prisma: PrismaService
    ){}
    
    async register(dto:RegisterDto){
        try {
            const cek = await this.prisma.users.findUnique({
                where: {
                    user_id: dto.user_id.trim()
                }
            });
            
            if(cek){
                throw new BadRequestException("User sudah terdaftar");
            }
            
            const pw = await bcrypt.hash(dto.user_id, 12);
            const newUser = await this.prisma.users.create({
                data: {
                    user_id: dto.user_id.trim(),
                    nama: toTitleCase(dto.nama),
                    no_whatsapp: dto.no_whatsapp.trim(),
                    sandi: pw,
                    status_user: 'active',
                    role: dto.role
                }
            });
            
            return newUser;
        } catch (error) {
            if (!(error instanceof Error)) {
                console.error('Kesalahan pada server : ', error);
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async login(dto: LoginDto) {
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    user_id: dto.user_id.trim(),
                },
                select: {
                    sandi: true,
                    role: true,
                    nama: true,
                    user_id: true,
                },
            });
            
            if (!user) {
                throw new UnauthorizedException('User tidak ditemukan');
            }
            
            const isMatch = await bcrypt.compare(dto.sandi, user.sandi);
            if (!isMatch) {
                throw new BadRequestException('NIM/NIP atau password tidak sesuai');
            }
            
        
            return {
                message: 'Login berhasil',
                data: {
                    user_id: user.user_id,
                    nama: user.nama,
                    role: user.role,
                },
            };
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}