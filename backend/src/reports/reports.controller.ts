import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

/** Retorna a data no início do dia (00:00:00.000) */
function startOf(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retorna a data no fim do dia (23:59:59.999) — inclui pedidos do dia inteiro */
function endOf(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("sales")
  async getSalesReport(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Request() req: any,
  ) {
    return this.reportsService.getSalesReport(
      req.user.establishmentId,
      startOf(startDate),
      endOf(endDate),
    );
  }

  @Get("products/top-selling")
  async getTopSellingProducts(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("limit") limit: string,
    @Request() req: any,
  ) {
    return this.reportsService.getTopSellingProducts(
      req.user.establishmentId,
      startOf(startDate),
      endOf(endDate),
      parseInt(limit) || 10,
    );
  }

  @Get("revenue")
  async getRevenueReport(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("groupBy") groupBy: "day" | "week" | "month",
    @Request() req: any,
  ) {
    return this.reportsService.getRevenueReport(
      req.user.establishmentId,
      startOf(startDate),
      endOf(endDate),
      groupBy || "day",
    );
  }

  @Get("orders/status")
  async getOrdersStatusReport(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Request() req: any,
  ) {
    return this.reportsService.getOrdersStatusReport(
      req.user.establishmentId,
      startOf(startDate),
      endOf(endDate),
    );
  }

  @Get("peak-hours")
  async getPeakHours(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Request() req: any,
  ) {
    return this.reportsService.getPeakHours(
      req.user.establishmentId,
      startOf(startDate),
      endOf(endDate),
    );
  }

  @Get("dashboard")
  async getDashboardStats(@Request() req: any) {
    return this.reportsService.getDashboardStats(req.user.establishmentId);
  }
}
