import { Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ProfileService } from "./profil.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('profil')
export class ProfileController{
    constructor(
        private profileService: ProfileService
    ){}
    
    @Get('view/:mahasiswa_id')
    async viewProfileMahasiswa(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.profileService.viewProfileMahasiswa(mahasiswa_id);
    }

    @Get('foto/:user_id')
    async getPhotoProfile(@Param('user_id') user_id:string){
        return await this.profileService.getPhotoProfile(user_id);
    }
    
    @Patch('change/:user_id')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new Error('Only image files are allowed!'), false);
            } else {
                cb(null, true);
            }
        }
    }))
    async changePhoto(@UploadedFile() file: Express.Multer.File, @Param('user_id') user_id:string){
        return await this.profileService.changePhoto(file, user_id);
    }
}