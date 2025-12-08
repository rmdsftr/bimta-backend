import { Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";

@Module({
    providers: [SupabaseService],
    imports: [SupabaseService],
    exports: [SupabaseService]
})
export class SupabaseModule{}