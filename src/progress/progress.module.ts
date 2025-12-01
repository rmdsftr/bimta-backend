import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
    imports: [PrismaModule],
    controllers: [ProgressController],
    providers: [ProgressService, SupabaseService],
})
export class ProgressModule{}