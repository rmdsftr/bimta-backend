import { IsEmpty, IsNotEmpty, IsString } from "class-validator";

export class ChangeNumberDto{
    //@IsEmpty()
    @IsNotEmpty()
    @IsString()
    nomorBaru: string;
}