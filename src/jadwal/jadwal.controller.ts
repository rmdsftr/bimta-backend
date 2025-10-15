import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { JadwalService } from "./jadwal.service";
import { AddJadwalDto } from "./dto/add-jadwal.dto";

@Controller('jadwal')
export class JadwalController{
    constructor(
        private jadwalService: JadwalService
    ){}

    @Post('add/:mahasiswa_id')
    async addJadwal(
        @Body() dto: AddJadwalDto,
        @Param('mahasiswa_id') mahasiswa_id:string){
        return await this.jadwalService.addJadwal(dto, mahasiswa_id);
    }

    @Get('view/:mahasiswa_id')
    async viewJadwal(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.jadwalService.viewJadwal(mahasiswa_id);
    }
}