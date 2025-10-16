import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { JadwalService } from "./jadwal.service";
import { AddJadwalDto } from "./dto/add-jadwal.dto";
import { ResponseJadwal } from "./dto/accepted-jadwal.dto";

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

    @Get('dosen/:dosen_id')
    async getJadwalDosen(@Param('dosen_id') dosen_id:string){
        return await this.jadwalService.getJadwalDosen(dosen_id);
    }

    @Patch('terima/:bimbingan_id/:datetime')
    async acceptedJadwal(
        @Param('bimbingan_id') bimbingan_id:string, 
        @Param('datetime') datetime:string,
        @Body() dto: ResponseJadwal
    ){
        return await this.jadwalService.acceptedJadwal(bimbingan_id, datetime, dto);
    }

    @Patch('tolak/:bimbingan_id/:datetime')
    async declinedJadwal(
        @Param('bimbingan_id') bimbingan_id:string, 
        @Param('datetime') datetime:string,
        @Body() dto: ResponseJadwal
    ){
        return await this.jadwalService.declinedJadwal(bimbingan_id, datetime, dto);
    }

    @Patch('cancel/:bimbingan_id/:datetime')
    async cancelJadwal(
        @Param('bimbingan_id') bimbingan_id:string, 
        @Param('datetime') datetime:string,
        @Body() dto: ResponseJadwal
    ){
        return await this.jadwalService.cancelJadwal(bimbingan_id, datetime, dto);
    }

    @Patch('done/:bimbingan_id/:datetime')
    async doneJadwal(
        @Param('bimbingan_id') bimbingan_id:string, 
        @Param('datetime') datetime:string,
        @Body() dto: ResponseJadwal
    ){
        return await this.jadwalService.doneJadwal(bimbingan_id, datetime, dto);
    }
}