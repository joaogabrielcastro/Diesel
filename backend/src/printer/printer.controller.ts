import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PrinterService } from "./printer.service";

@Controller("printer")
@UseGuards(JwtAuthGuard)
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  /**
   * Imprime (ou reimprime) um pedido
   * POST /printer/orders/:orderId/print
   */
  @Post("orders/:orderId/print")
  @HttpCode(HttpStatus.OK)
  async printOrder(@Param("orderId") orderId: string, @Request() req) {
    const establishmentId = req.user.establishmentId;

    await this.printerService.printOrder(orderId, establishmentId);

    return {
      success: true,
      message: "Pedido enviado para impressão",
      orderId,
    };
  }

  /**
   * Lista histórico de impressões de um pedido
   * GET /printer/orders/:orderId/history
   */
  @Get("orders/:orderId/history")
  async getPrintHistory(@Param("orderId") orderId: string, @Request() req) {
    const establishmentId = req.user.establishmentId;

    const history = await this.printerService.getPrintHistory(
      orderId,
      establishmentId,
    );

    return {
      orderId,
      prints: history,
    };
  }
}
