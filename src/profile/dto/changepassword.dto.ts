import { IsEmpty, IsString } from "class-validator";

export class ChangePasswordDto{
    @IsEmpty()
    @IsString()
    sandiLama: string;

    @IsEmpty()
    @IsString()
    sandiBaru: string;

    @IsEmpty()
    @IsString()
    konfirmasiSandi: string;
}
