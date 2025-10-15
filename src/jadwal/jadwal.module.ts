import { Module } from "@nestjs/common";
import { JadwalController } from "./jadwal.controller";
import { JadwalService } from "./jadwal.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    controllers: [JadwalController],
    providers: [JadwalService],
    imports : [PrismaModule]
})
export class JadwalModule{}