import { Module } from "@nestjs/common";
import { KegiatanController } from "./kegiatan.controller";
import { KegiatanService } from "./kegiatan.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    controllers: [KegiatanController],
    providers: [KegiatanService], 
    imports: [PrismaModule]
})
export class KegiatanModule{}