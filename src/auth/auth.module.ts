import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { JwtTokenUtil } from "../utils/jwt_token";
import { UserValidator } from "../validators/user.validator";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { PrismaModule } from "../prisma/prisma.module";

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