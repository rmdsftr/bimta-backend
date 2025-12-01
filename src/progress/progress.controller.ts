import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProgressService } from "./progress.service";
import { addProgressOnlineDto } from "./dto/add-progress.dto";

@Controller('progress')
export class ProgressController{
    constructor(
        private progressService: ProgressService
    ){}
    
    @Post('add/:mahasiswa_id')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'application/pdf') {
                cb(new Error('Only PDF files are allowed!'), false);
            } else {
                cb(null, true);
            }
        },
    }))
    async addProgressOnline(
        @Body() dto: addProgressOnlineDto,
        @Param('mahasiswa_id') mahasiswa_id:string,
        @UploadedFile() file: Express.Multer.File
    ){
        return await this.progressService.addProgressOnline(dto, mahasiswa_id, file);
    }

    @Get(':mahasiswa_id')
    async allProgressOnline(@Param('mahasiswa_id') mahasiswa_id:string){
        return await this.progressService.allProgressOnline(mahasiswa_id);
    }

    @Get('dosen/:dosen_id')
    async progressOnlineMahasiswa(@Param('dosen_id') dosen_id:string){
        return await this.progressService.progressOnlineMahasiswa(dosen_id);
    }

    @Get('pending/:dosen_id')
    async hitungPendingReview(@Param('dosen_id') dosen_id:string){
        return await this.progressService.hitungPendingReview(dosen_id);
    }
}