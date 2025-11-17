import { Controller, Get, Param } from "@nestjs/common";
import { RiwayatService } from "./riwayat.service";

@Controller('riwayat')
export class RiwayatController{
    constructor(
        private riwayatService: RiwayatService
    ){}

    @Get(':mahasiswa_id')
    async getRiwayat(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.riwayatService.riwayatBimbingan(mahasiswa_id)
    }
}