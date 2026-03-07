import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { ProductsModule } from "../products/products.module";
import { PrinterModule } from "../printer/printer.module";

@Module({
  imports: [ProductsModule, PrinterModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
