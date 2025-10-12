import { Module } from "@nestjs/common";
import { GeneralService } from "./general.service.js";
import { GeneralController } from "./general.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    providers: [GeneralService],
    controllers: [GeneralController],
    imports: [PrismaModule]
})
export class GeneralModule{}