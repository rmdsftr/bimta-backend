import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GeneralService{
    constructor(
        private prisma: PrismaService
    ){}

    async referensiTa(){
        try {
            const referensi = await this.prisma.referensi_ta.findMany({
                select: {
                    nim_mahasiswa: true,
                    nama_mahasiswa: true,
                    topik: true,
                    judul: true,
                    tahun: true
                }
            });

            return referensi;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}