import { IsEmpty, IsString } from "class-validator";

export class ChangeNumberDto{
    @IsEmpty()
    @IsString()
    nomorBaru: string;
}