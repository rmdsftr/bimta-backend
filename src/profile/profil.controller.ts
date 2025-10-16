import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ProfileService } from "./profil.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { ChangePasswordDto } from "./dto/changepassword.dto";
import { ChangeNumberDto } from "./dto/changenumber.dto";
import { GantiJudulDto } from "./dto/changejudul.dto";

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
                cb(null, true)
            }
        }
    }))
    async changePhoto(@UploadedFile() file: Express.Multer.File, @Param('user_id') user_id:string){
        return await this.profileService.changePhoto(file, user_id);
    }
    
    @Post('change/:user_id')
    async changePasswordUser(@Param('user_id') user_id:string, @Body() dto:ChangePasswordDto){
        return await this.profileService.changePasswordUser(user_id, dto);
    }

    @Patch('changeNumber/:user_id')
    async changeNumberUser(@Param('user_id') user_id:string, @Body() dto:ChangeNumberDto){
        return await this.profileService.changenNumberUser(user_id, dto);
    }

    @Get('mahasiswa/:mahasiswa_id')
    async getInfoMahasiswa(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.profileService.getInfoMahasiswa(mahasiswa_id);
    }

    @Patch('gantiJudul/:mahasiswa_id')
    async gantiJudul(@Param('mahasiswa_id') mahasiswa_id:string, @Body() dto:GantiJudulDto){
        return await this.profileService.gantiJudul(mahasiswa_id, dto);
    }

    @Patch('accJudul/:mahasiswa_id')
    async accGantiJudul(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.profileService.accGantiJudul(mahasiswa_id)
    }

    @Patch('rejectJudul/:mahasiswa_id')
    async rejectGantiJudul(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.profileService.rejectGantiJudul(mahasiswa_id)
    }
}