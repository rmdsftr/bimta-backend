import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class AddMahasiswaBimbinganDto{
    @IsNotEmpty()
    @IsString()
    dosen_id: string;

    @IsNotEmpty()
    @IsArray() 
    @IsString({ each: true }) 
    mahasiswa_id: string[];
}