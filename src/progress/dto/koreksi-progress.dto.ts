import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class KoreksiProgressDto {
    @IsString()
    @IsNotEmpty({ message: 'Evaluasi dosen tidak boleh kosong' })
    evaluasi_dosen: string;

    @IsEnum(['need_revision', 'done'], {
        message: 'Status harus need_revision atau done'
    })
    @IsNotEmpty({ message: 'Status progress tidak boleh kosong' })
    status_progress: 'need_revision' | 'done';
}