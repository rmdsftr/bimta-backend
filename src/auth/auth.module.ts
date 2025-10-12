import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./strategy/jwt.strategy.js";
import { JwtTokenUtil } from "../utils/jwt_token.js";
import { UserValidator } from "../validators/user.validator.js";
import { JwtAuthGuard } from "./guards/jwt.guard.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtTokenUtil, UserValidator, JwtAuthGuard],
    imports: [PrismaModule, PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async(configService: ConfigService) => ({
                secret: configService.get<string>('jwt.secret'),
                signOptions: {
                    expiresIn: configService.get<string>('jwt.accessTokenExpiry') || '15m',
                    issuer: 'bimta'
                }
            })
        })
    ],
    exports: [AuthService]
})
export class AuthModule{}