import { Body, Controller, Post } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

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
    async login(@Body() dto:LoginDto){
        console.log("data yang didapat : ", dto);
        return await this.authService.login(dto);
    }
}