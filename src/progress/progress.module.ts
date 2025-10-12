import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SupabaseService } from "../supabase/supabase.service.js";

@Module({
    imports: [PrismaModule],
    controllers: [ProgressController],
    providers: [ProgressService, SupabaseService],
})
export class ProgressModule{}