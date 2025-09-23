import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto{
    @IsNotEmpty()
    @IsString()
    user_id:string;

    @IsNotEmpty()
    @IsString()
    sandi:string;
}