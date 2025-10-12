import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProgressService } from "./progress.service.js";
import { addProgressOnlineDto } from "./dto/add-progress.dto.js";

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
}