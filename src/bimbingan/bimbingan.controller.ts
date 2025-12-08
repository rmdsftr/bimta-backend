import { Body, Controller, Delete, Get, Param, Patch, Post, HttpCode, BadRequestException } from "@nestjs/common";
import { BimbinganService } from "./bimbingan.service";
import { AddMahasiswaBimbinganDto } from "./dto/add-mahasiswa.dto";

@Controller('bimbingan')
export class BimbinganController {
    constructor(
        private bimbinganService: BimbinganService
    ) {}
    
    
    @Get('jumlah/:dosen_id')
    async jumlahMahasiswaBimbingan(@Param('dosen_id') dosen_id: string) {
        this.validateParam(dosen_id, 'ID dosen');
        return this.bimbinganService.jumlahMahasiswaBimbingan(dosen_id);
    }

    @Get('dospem/:mahasiswa_id')
    async dosenPembimbing(@Param('mahasiswa_id') mahasiswa_id: string) {
        this.validateParam(mahasiswa_id, 'ID mahasiswa');
        return this.bimbinganService.dosenPembimbing(mahasiswa_id);
    }

    
    @Get(':dosen_id')
    async mahasiswaDibimbing(@Param('dosen_id') dosen_id: string) {
        this.validateParam(dosen_id, 'ID dosen');
        return this.bimbinganService.mahasiswaDibimbing(dosen_id);
    }

    @Post('add')
    @HttpCode(201)
    async AddMahasiswa(@Body() dto: AddMahasiswaBimbinganDto) {
        return this.bimbinganService.addMahasiswa(dto);
    }

    @Delete('hapus/:dosen_id/:mahasiswa_id')
    async hapusMahasiswaBimbingan(
        @Param('dosen_id') dosen_id: string, 
        @Param('mahasiswa_id') mahasiswa_id: string
    ) {
        this.validateParam(dosen_id, 'ID dosen');
        this.validateParam(mahasiswa_id, 'ID mahasiswa');
        return this.bimbinganService.hapusMahasiswaBimbingan(dosen_id, mahasiswa_id);
    }

    @Patch('selesai/:mahasiswa_id')
    async selesaiBimbingan(@Param('mahasiswa_id') mahasiswa_id: string) {
        this.validateParam(mahasiswa_id, 'ID mahasiswa');
        return this.bimbinganService.selesaiBimbingan(mahasiswa_id);
    }

    
    private validateParam(param: string, paramName: string): void {
        if (!param || !param.trim()) {
            throw new BadRequestException(`${paramName} tidak valid`);
        }
    }
}