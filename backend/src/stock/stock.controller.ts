import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StockService } from "./stock.service";
import {
  CreateIngredientDto,
  CreateStockMovementDto,
  UpdateStockDto,
} from "./dto/stock.dto";

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
  // Explicit route for getting ingredient stock details
  @Get("ingredient/:id")
  async getIngredient(@Param("id") id: string, @Request() req) {
    return this.stockService.getProductStock(req.user.establishmentId, id);
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

  @Post("ingredient")
  async createIngredient(
    @Body() data: CreateIngredientDto,
    @Request() req: any,
  ) {
    return this.stockService.createIngredient(req.user.establishmentId, {
      name: data.name,
      unit: data.unit,
      minStock: Number(data.minStock),
      currentStock: Number(data.currentStock),
      ingredientType: data.ingredientType || "OUTRO",
    });
  }

  @Delete("ingredient/:id")
  async deleteIngredient(@Param("id") id: string, @Request() req: any) {
    return this.stockService.deleteIngredient(req.user.establishmentId, id);
  }

  @Post("movement")
  async createMovement(
    @Body() data: CreateStockMovementDto,
    @Request() req: any,
  ) {
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
    @Body() data: UpdateStockDto,
    @Request() req: any,
  ) {
    return this.stockService.updateProductStock(
      req.user.establishmentId,
      productId,
      data,
    );
  }
}
