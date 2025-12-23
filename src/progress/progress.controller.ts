import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProgressService } from "./progress.service";
import { addProgressOnlineDto } from "./dto/add-progress.dto";
import { KoreksiProgressDto } from "./dto/koreksi-progress.dto";
import { pdfFileFilter } from "../utils/pdf-file-filter.util";

@Controller('progress')
export class ProgressController {
    constructor(
        private progressService: ProgressService
    ) { }

    @Post('add/:mahasiswa_id')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: pdfFileFilter,
    }))
    async addProgressOnline(
        @Body() dto: addProgressOnlineDto,
        @Param('mahasiswa_id') mahasiswa_id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.progressService.addProgressOnline(dto, mahasiswa_id, file);
    }

    @Get(':mahasiswa_id')
    async allProgressOnline(@Param('mahasiswa_id') mahasiswa_id: string) {
        return await this.progressService.allProgressOnline(mahasiswa_id);
    }

    @Get('dosen/:dosen_id')
    async progressOnlineMahasiswa(@Param('dosen_id') dosen_id: string) {
        return await this.progressService.progressOnlineMahasiswa(dosen_id);
    }

    @Get('pending/:dosen_id')
    async hitungPendingReview(@Param('dosen_id') dosen_id: string) {
        return await this.progressService.hitungPendingReview(dosen_id);
    }

    @Patch('mark-read/:progress_id')
    async markAsRead(@Param('progress_id') progress_id: string) {
        return await this.progressService.markAsRead(progress_id);
    }

    @Post('koreksi/:progress_id')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'application/pdf') {
                cb(new BadRequestException('Only PDF files are allowed!'), false);
            } else {
                cb(null, true);
            }
        },
    }))
    async submitKoreksi(
        @Param('progress_id') progress_id: string,
        @Body() dto: KoreksiProgressDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return await this.progressService.submitKoreksi(progress_id, dto, file);
    }
}