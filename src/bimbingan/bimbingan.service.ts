import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { status_bimbingan_enum } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AddMahasiswaBimbinganDto } from "./dto/add-mahasiswa.dto";

@Injectable()
export class BimbinganService{
    constructor(
        private prisma: PrismaService
    ){}
    
    async mahasiswaDibimbing(dosen_id:string){
        try {
            const mahasiswa = await this.prisma.bimbingan.findMany({
                where: {
                    dosen_id: dosen_id
                }, select: {
                    status_bimbingan: true,
                    users_bimbingan_mahasiswa_idTousers:{
                        select: {
                            user_id: true,
                            nama: true,
                            judul: true,
                            photo_url: true
                        }
                    }
                }
            });
            
            return mahasiswa;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async addMahasiswa(dto: AddMahasiswaBimbinganDto) {
        try {
            const dataToInsert = dto.mahasiswa_id.map((mhsId) => ({
                bimbingan_id: `${dto.dosen_id}-${mhsId}`,
                dosen_id: dto.dosen_id,
                mahasiswa_id: mhsId,
                status_bimbingan: status_bimbingan_enum.ongoing,
                total_bimbingan: 0,
            }));
            
            const add = await this.prisma.bimbingan.createMany({
                data: dataToInsert,
                skipDuplicates: true, 
            });
            
            return true;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async dosenPembimbing(mahasiswa_id:string){
        try {
            const dosen = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id
                }, select: {
                    users_bimbingan_dosen_idTousers:{
                        select: {
                            nama: true
                        }
                    }
                }
            })
            
            return dosen;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async jumlahMahasiswaBimbingan(dosen_id: string) {
        try {
            const jumlah = await this.prisma.bimbingan.count({
                where: {
                    dosen_id: dosen_id,
                    NOT: {
                        status_bimbingan: 'done',
                    },
                },
            });
            
            return jumlah;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async hapusMahasiswaBimbingan(dosen_id: string, mahasiswa_id: string) {
        try {
            const bimbingan = await this.prisma.bimbingan.findFirst({
                where: {
                    dosen_id,
                    mahasiswa_id
                },
                select: {
                    bimbingan_id: true
                }
            });
            
            if (!bimbingan) {
                throw new NotFoundException('Data bimbingan tidak ditemukan');
            }
            
            const { bimbingan_id } = bimbingan;
            
            await this.prisma.$transaction([
                this.prisma.progress.deleteMany({
                    where: { bimbingan_id }
                }),
                this.prisma.jadwal.deleteMany({
                    where: { bimbingan_id }
                }),
                this.prisma.bimbingan.delete({
                    where: { bimbingan_id }
                }),
            ]);
            
            return true;
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
    
    async selesaiBimbingan(mahasiswa_id: string) {
        try {
            const bimbinganId = await this.prisma.bimbingan.findMany({
                where: {
                    mahasiswa_id: mahasiswa_id
                },
                select: {
                    bimbingan_id: true
                }
            });
            
            const ids = bimbinganId.map((item) => item.bimbingan_id);
            
            await this.prisma.bimbingan.updateMany({
                where: {
                    bimbingan_id: {
                        in: ids
                    }
                },
                data: {
                    status_bimbingan: status_bimbingan_enum.done
                }
            });
        } catch (error) {
            console.error(error);
            if (!(error instanceof Error)) {
                throw new InternalServerErrorException('Terjadi kesalahan pada server');
            }
            throw error;
        }
    }
}