import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class AddKegiatanDto{
    @IsNotEmpty()
    @IsString()
    kegiatan: string;

    @IsNotEmpty()
    @IsDateString()
    tanggal: string;

    @IsNotEmpty()
    @IsString()
    jam_mulai: string;

    @IsNotEmpty()
    @IsString()
    jam_selesai: string;
}