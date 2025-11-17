import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtTokenUtil } from "../utils/jwt_token.js";
import { UserValidator } from "../validators/user.validator.js";
import { RegisterDto } from "./dto/register.dto.js";
import { toTitleCase } from "../utils/word_case.js";
import { LoginDto } from "./dto/login.dto.js";
import { jwtPayload } from "./interfaces/payload.js";

@Injectable()
export class AuthService{
    constructor(
        private prisma: PrismaService,
        private jwtTokenUtil: JwtTokenUtil,
        private userValidator: UserValidator
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
                throw new UnauthorizedException('NIM/NIP atau password tidak sesuai');
            }

            const payload: jwtPayload = await this.userValidator.validateUser(dto.user_id);
            const token = await this.jwtTokenUtil.generateTokens(payload);

            console.log("access_token : ", token.access_token);
            console.log("refresh_token : ", token.refresh_token);

            return {
                message: 'Login berhasil',
                data: {
                    user_id: user.user_id,
                    nama: user.nama,
                    role: user.role,
                    access_token: token.access_token,
                    refresh_token: token.refresh_token
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

    async logout(token: string, user: any) {
        try {
            if (!token) {
                throw new UnauthorizedException('Token tidak ditemukan');
            }

            console.log(`User ${user?.user_id || 'Unknown'} melakukan logout`);

            return {
                success: true,
                message: 'Logout berhasil'
            };
        } catch (error) {
            console.error('Error saat logout:', error);
            
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            
            return {
                success: true,
                message: 'Logout berhasil'
            };
        }
    }
}