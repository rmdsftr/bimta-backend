import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { KegiatanService } from "./kegiatan.service";
import { AddKegiatanDto } from "./dto/add-kegiatan.dto";

@Controller('kegiatan')
export class KegiatanController {
    constructor(
        private kegiatanService: KegiatanService
    ) {}

    @Post('add/:dosen_id')
    async addKegiatan(
        @Param('dosen_id') dosen_id: string, 
        @Body() dto: AddKegiatanDto
    ) {
        return await this.kegiatanService.addKegiatan(dosen_id, dto);
    }

    @Get('dosen/:dosen_id')
    async getKegiatanByMonth(
        @Param('dosen_id') dosen_id: string,
        @Query('year') year: string,
        @Query('month') month: string
    ) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        return await this.kegiatanService.getKegiatanByMonth(dosen_id, yearNum, monthNum);
    }

    @Get('dosen/:dosen_id/date/:date')
    async getKegiatanByDate(
        @Param('dosen_id') dosen_id: string,
        @Param('date') date: string
    ) {
        return await this.kegiatanService.getKegiatanByDate(dosen_id, date);
    }

    @Delete(':jadwal_dosen_id')
    async deleteKegiatan(
        @Param('jadwal_dosen_id') jadwal_dosen_id: string
    ) {
        return await this.kegiatanService.deleteKegiatan(jadwal_dosen_id);
    }

    @Get('mahasiswa/:mahasiswa_id')
    async getKegiatanByBulan(
        @Param('mahasiswa_id') mahasiswa_id: string,
        @Query('year') year: string,
        @Query('month') month: string
    ) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        return await this.kegiatanService.getKegiatanByBulan(mahasiswa_id, yearNum, monthNum);
    }

    @Get('mahasiswa/:mahasiswa_id/date/:date')
    async getKegiatanByTanggal(
        @Param('mahasiswa_id') mahasiswa_id: string,
        @Param('date') date: string
    ) {
        return await this.kegiatanService.getKegiatanByTahun(mahasiswa_id, date);
    }
}