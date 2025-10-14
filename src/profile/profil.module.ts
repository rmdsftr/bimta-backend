import { Module } from "@nestjs/common";
import { ProfileController } from "./profil.controller";
import { ProfileService } from "./profil.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    controllers: [ProfileController],
    providers: [ProfileService],
    imports: [PrismaModule]
})
export class ProfileModule{}