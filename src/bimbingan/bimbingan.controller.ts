import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { BimbinganService } from "./bimbingan.service";
import { AddMahasiswaBimbinganDto } from "./dto/add-mahasiswa.dto";

@Controller('bimbingan')
export class BimbinganController{
    constructor(
        private bimbinganService: BimbinganService
    ){}

    @Get(':dosen_id')
    async mahasiswaDibimbing(@Param('dosen_id') dosen_id:string){
        return await this.bimbinganService.mahasiswaDibimbing(dosen_id);
    }

    @Get('jumlah/:dosen_id')
    async jumlahMahasiswaBimbingan(@Param('dosen_id') dosen_id:string){
        return await this.bimbinganService.jumlahMahasiswaBimbingan(dosen_id);
    }

    @Get('dospem/:mahasiswa_id')
    async dosenPembimbing(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.bimbinganService.dosenPembimbing(mahasiswa_id);
    }

    @Post('add')
    async AddMahasiswa(@Body() dto:AddMahasiswaBimbinganDto){
        return await this.bimbinganService.addMahasiswa(dto);
    }

    @Delete('hapus/:dosen_id/:mahasiswa_id')
    async hapusMahasiswaBimbingan(@Param('dosen_id') dosen_id:string, @Param('mahasiswa_id') mahasiswa_id:string){
        return await this.bimbinganService.hapusMahasiswaBimbingan(dosen_id, mahasiswa_id);
    }

    @Patch('selesai/:mahasiswa_id')
    async selesaiBimbingan(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.bimbinganService.selesaiBimbingan(mahasiswa_id);
    }
}