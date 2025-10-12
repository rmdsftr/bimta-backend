import { IsNotEmpty, IsString } from "class-validator";

export class AddMahasiswaBimbinganDto{
    @IsNotEmpty()
    @IsString()
    dosen_id: string;

    @IsNotEmpty()
    @IsString()
    mahasiswa_id:string[];
}