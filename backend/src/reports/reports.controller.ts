import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

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
      new Date(startDate),
      new Date(endDate),
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
      new Date(startDate),
      new Date(endDate),
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
      new Date(startDate),
      new Date(endDate),
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
      new Date(startDate),
      new Date(endDate),
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
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get("dashboard")
  async getDashboardStats(@Request() req: any) {
    return this.reportsService.getDashboardStats(req.user.establishmentId);
  }
}
