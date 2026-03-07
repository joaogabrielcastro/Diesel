import { Module } from "@nestjs/common";
import { PrinterService } from "./printer.service";
import { PrinterController } from "./printer.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
