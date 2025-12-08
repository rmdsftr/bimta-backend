import { Module } from "@nestjs/common";
import { GeneralService } from "./general.service";
import { GeneralController } from "./general.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    providers: [GeneralService],
    controllers: [GeneralController],
    imports: [PrismaModule]
})
export class GeneralModule{}