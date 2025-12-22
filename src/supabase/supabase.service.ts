import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import path from "path";

@Injectable()
export class SupabaseService{
    downloadFile(arg0: string, arg1: string) {
        throw new Error('Method not implemented.');
    }
    private supabase: SupabaseClient;
    
    constructor(){
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        if(supabaseKey && supabaseUrl){
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
    }
    
    async uploadProgressFile(file: Express.Multer.File, folder: string = "progress"): Promise<{ publicUrl: string, filename: string }> {
        try {
            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); 
            const ext = path.extname(file.originalname);
            const filename = `${timestamp}${ext}`;
            const filepath = `${folder}/${filename}`; 
            
            const { error } = await this.supabase.storage
            .from('bimta')
            .upload(filepath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });
            
            if (error) {
                console.error('Upload failed:', error.message);
                throw new InternalServerErrorException("Gagal mengunggah file ke Supabase");
            }
            
            const { data: publicUrlData } = this.supabase.storage
            .from('bimta')
            .getPublicUrl(filepath);
            
            return {
                publicUrl: publicUrlData.publicUrl,
                filename,
            };
        } catch (err) {
            console.error('Upload error:', err);
            throw new InternalServerErrorException("Terjadi kesalahan saat upload file");
        }
    }

    async uploadPhoto(file: Express.Multer.File, folder: string = "profil"){
        try {
            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); 
            const ext = path.extname(file.originalname);
            const filename = `${timestamp}${ext}`;
            const filepath = `${folder}/${filename}`; 
            
            const { error } = await this.supabase.storage
            .from('bimta')
            .upload(filepath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });
            
            if (error) {
                console.error('Upload failed:', error.message);
                throw new InternalServerErrorException("Gagal mengunggah file ke Supabase");
            }
            
            const { data: publicUrlData } = this.supabase.storage
            .from('bimta')
            .getPublicUrl(filepath);

            const publicUrl = publicUrlData.publicUrl
            
            return publicUrl;
        } catch (err) {
            console.error('Upload error:', err);
            throw new InternalServerErrorException("Terjadi kesalahan saat upload file");
        }
    }
    
}