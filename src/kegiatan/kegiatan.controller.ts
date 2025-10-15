import { Controller, Param, Post } from "@nestjs/common";
import { KegiatanService } from "./kegiatan.service";

@Controller('kegiatan')
export class KegiatanController{
    constructor(
        private kegiatanService: KegiatanService
    ){}

    @Post('add/:dosen_id')
    async addKegiatan(@Param('dosen_id') dosen_id:string){
        return await this.kegiatanService.addKegiatan(dosen_id);
    }
}