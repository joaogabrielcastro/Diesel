import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StockService } from "./stock.service";

@Controller("stock")
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async getAll(@Request() req: any, @Query("lowStock") lowStock: string) {
    if (lowStock === "true") {
      return this.stockService.getLowStockProducts(req.user.establishmentId);
    }
    return this.stockService.getAllStock(req.user.establishmentId);
  }

  @Get("alerts")
  async getAlerts(@Request() req: any) {
    return this.stockService.getStockAlerts(req.user.establishmentId);
  }

  @Get("movements")
  async getMovements(
    @Request() req: any,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.stockService.getStockMovements(
      req.user.establishmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get("predictions")
  async getPredictions(@Request() req: any) {
    return this.stockService.getStockPredictions(req.user.establishmentId);
  }

  @Get(":productId")
  async getByProduct(
    @Param("productId") productId: string,
    @Request() req: any,
  ) {
    return this.stockService.getProductStock(
      req.user.establishmentId,
      productId,
    );
  }

  @Post("movement")
  async createMovement(@Body() data: any, @Request() req: any) {
    return this.stockService.createStockMovement(req.user.establishmentId, {
      productId: data.productId,
      quantity: data.quantity,
      type: data.type,
      reason: data.reason,
      userId: req.user.id,
    });
  }

  @Patch(":productId")
  async updateStock(
    @Param("productId") productId: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.stockService.updateProductStock(
      req.user.establishmentId,
      productId,
      data,
    );
  }
}
