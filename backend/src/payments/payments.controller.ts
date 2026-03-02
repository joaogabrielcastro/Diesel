import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * GET /payments/table/:tableId
   * Obtém relatório de consumo de uma mesa específica
   */
  @Get("table/:tableId")
  async getTableConsumption(
    @Param("tableId") tableId: string,
    @Request() req: any,
  ) {
    return this.paymentsService.getTableConsumption(
      tableId,
      req.user.establishmentId,
    );
  }

  /**
   * GET /payments/tables/active
   * Obtém relatório de todas as mesas ativas
   */
  @Get("tables/active")
  async getAllActiveTablesConsumption(@Request() req: any) {
    return this.paymentsService.getAllActiveTablesConsumption(
      req.user.establishmentId,
    );
  }

  /**
   * POST /payments/table/:tableId/close
   * Fecha a conta de uma mesa (marca comandas como pagas)
   */
  @Post("table/:tableId/close")
  async closeTableAccount(
    @Param("tableId") tableId: string,
    @Body() body: { paymentMethod: "CASH" | "CARD" | "PIX" },
    @Request() req: any,
  ) {
    return this.paymentsService.closeTableAccount(
      tableId,
      req.user.establishmentId,
      body.paymentMethod,
    );
  }
}
