import { Controller, Get, Param } from "@nestjs/common";
import { GeneralService } from "./general.service.js";

@Controller('general')
export class GeneralController{
    constructor(
        private generalService: GeneralService
    ){}

    @Get('ta')
    async ReferensiTa(){
        return await this.generalService.referensiTa();
    }

    @Get('mahasiswa/:dosen_id')
    async mahasiswa(@Param('dosen_id') dosen_id:string){
        return await this.generalService.mahasiswa(dosen_id);
    }
}