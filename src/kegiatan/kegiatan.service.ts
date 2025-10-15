import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class KegiatanService{
    constructor(
        private prisma: PrismaService
    ){}

    async addKegiatan(dosen_id:string){
        try {
            
        } catch (error) {
            
        }
    }
}