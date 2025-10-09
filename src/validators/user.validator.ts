import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtPayload } from "jsonwebtoken";

@Injectable()
export class UserValidator{
    constructor(
        private prisma: PrismaService
    ){}

    async validateUser(userId: string): Promise<JwtPayload | any>{
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    user_id: userId
                }
            });

            if(!user) throw new UnauthorizedException("User tidak ditemukan");

            return {
                user_id: user.user_id,
                nama :  user.nama,
                role: user.role
            }
        } catch (error) {
            console.error("Error saat validasi authentikasi:", error);
            throw error; 
        }
    }
}