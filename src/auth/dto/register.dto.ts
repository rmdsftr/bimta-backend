import { role_enum } from "@prisma/client/edge";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto{
    @IsNotEmpty()
    @IsString()
    user_id:string;

    @IsNotEmpty()
    @IsString()
    nama:string;

    @IsNotEmpty()
    @IsString()
    no_whatsapp:string;

    @IsNotEmpty()
    @IsEnum(role_enum)
    role: role_enum
}