import { Module } from "@nestjs/common";
import { BimbinganService } from "./bimbingan.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { BimbinganController } from "./bimbingan.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    providers: [BimbinganService, AuthModule],
    controllers: [BimbinganController],
    imports: [PrismaModule]
})
export class BimbinganModule{}