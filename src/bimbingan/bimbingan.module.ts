import { Module } from "@nestjs/common";
import { BimbinganService } from "./bimbingan.service";
import { AuthModule } from "../auth/auth.module";
import { BimbinganController } from "./bimbingan.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    providers: [BimbinganService, AuthModule],
    controllers: [BimbinganController],
    imports: [PrismaModule]
})
export class BimbinganModule{}