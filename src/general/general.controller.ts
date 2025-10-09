import { Controller, Get } from "@nestjs/common";
import { GeneralService } from "./general.service";

@Controller('general')
export class GeneralController{
    constructor(
        private generalService: GeneralService
    ){}

    @Get('ta')
    async ReferensiTa(){
        return await this.generalService.referensiTa();
    }
}