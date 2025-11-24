import { IsEmpty, IsString, IsNotEmpty } from "class-validator";

export class ChangePasswordDto{
    @IsNotEmpty()
    @IsString()
    sandiLama: string;

    @IsNotEmpty()
    @IsString()
    sandiBaru: string;

    @IsNotEmpty()
    @IsString()
    konfirmasiSandi: string;
}
