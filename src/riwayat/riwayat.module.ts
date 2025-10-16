import { Module } from "@nestjs/common";
import { RiwayatController } from "./riwayat.controller";
import { RiwayatService } from "./riwayat.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    controllers: [RiwayatController],
    providers: [RiwayatService],
    imports: [PrismaModule]
})
export class RiwayatModule{}