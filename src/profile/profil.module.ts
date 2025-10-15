import { Module } from "@nestjs/common";
import { ProfileController } from "./profil.controller";
import { ProfileService } from "./profil.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
    controllers: [ProfileController],
    providers: [ProfileService, SupabaseService],
    imports: [PrismaModule]
})
export class ProfileModule{}