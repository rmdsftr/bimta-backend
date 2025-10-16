import { IsNotEmpty, IsString } from "class-validator";

export class ResponseJadwal{
    @IsNotEmpty()
    @IsString()
    note_dosen: string;
}