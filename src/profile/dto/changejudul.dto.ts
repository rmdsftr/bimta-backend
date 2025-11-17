import { IsNotEmpty, IsString } from "class-validator";

export class GantiJudulDto{
    @IsNotEmpty()
    @IsString()
    judulBaru:string;
}