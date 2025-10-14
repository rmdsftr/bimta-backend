import { Controller, Get, Param } from "@nestjs/common";
import { ProfileService } from "./profil.service";

@Controller('profil')
export class ProfileController{
    constructor(
        private profileService: ProfileService
    ){}

    @Get('view/:mahasiswa_id')
    async viewProfileMahasiswa(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.profileService.viewProfileMahasiswa(mahasiswa_id);
    }
}