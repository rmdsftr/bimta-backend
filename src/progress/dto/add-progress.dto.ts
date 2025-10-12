import { IsNotEmpty, IsString } from "class-validator";

export class addProgressOnlineDto{
    @IsNotEmpty()
    @IsString()
    subject_progress:string;

    @IsNotEmpty()
    @IsString()
    note_mahasiswa:string;
}