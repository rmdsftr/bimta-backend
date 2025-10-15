import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class AddJadwalDto{
    @IsNotEmpty()
    @IsString()
    judul:string;

    @IsNotEmpty()
    @IsDateString()
    tanggal:string;

    @IsNotEmpty()
    @IsString()
    waktu:string;

    @IsNotEmpty()
    @IsString()
    lokasi:string;

    @IsNotEmpty()
    @IsString()
    pesan:string;
}