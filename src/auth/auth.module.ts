import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    controllers: [AuthController],
    providers: [AuthService],
    imports: [PrismaModule]
})
export class AuthModule{}