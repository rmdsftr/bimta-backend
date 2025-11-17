import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { JwtAuthGuard } from "./guards/jwt.guard.js";

@Controller('auth')
export class AuthController{
    constructor(
        private authService:AuthService
    ){}

    @Post('register')
    async register(@Body() dto:RegisterDto){
        return await this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto:LoginDto){
        console.log("data yang didapat : ", dto);
        return await this.authService.login(dto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: Request) {
        const token = req.headers.authorization?.replace('Bearer ', '') || '';
        const user = req.user; 
        return await this.authService.logout(token, user);
    }
}