import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getAllStock(establishmentId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { establishmentId },
      orderBy: { name: "asc" },
    });

    return ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      category: "Ingrediente",
      currentStock: Number(ingredient.currentStock),
      minStock: Number(ingredient.minStock),
      maxStock: Number(ingredient.minStock) * 3,
    }));
  }

  async getLowStockProducts(establishmentId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { establishmentId },
      orderBy: { currentStock: "asc" },
    });

    return ingredients
      .filter((i) => Number(i.currentStock) <= Number(i.minStock))
      .map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        category: "Ingrediente",
        currentStock: Number(ingredient.currentStock),
        minStock: Number(ingredient.minStock),
      }));
  }

  async getStockAlerts(establishmentId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { establishmentId },
    });

    const critical: any[] = [];
    const warning: any[] = [];
    const attention: any[] = [];

    for (const ingredient of ingredients) {
      const current = Number(ingredient.currentStock);
      const min = Number(ingredient.minStock);

      if (current === 0) {
        critical.push({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          currentStock: current,
          minStock: min,
          category: "Ingrediente",
        });
      } else if (current <= min * 0.5) {
        warning.push({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          currentStock: current,
          minStock: min,
          category: "Ingrediente",
        });
      } else if (current <= min) {
        attention.push({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          currentStock: current,
          minStock: min,
          category: "Ingrediente",
        });
      }
    }

    return {
      products: {
        critical,
        warning,
        attention,
      },
    };
  }

  async getStockMovements(
    establishmentId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        establishmentId,
        ...(startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
      include: {
        ingredient: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return movements.map((movement) => ({
      id: movement.id,
      productName: movement.ingredient.name,
      type: movement.type,
      quantity: Number(movement.quantity),
      reason: movement.reason,
      userName: movement.user?.name || "Sistema",
      createdAt: movement.createdAt,
    }));
  }

  async getStockPredictions(establishmentId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { establishmentId },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const predictions = await Promise.all(
      ingredients.map(async (ingredient) => {
        const movements = await this.prisma.stockMovement.findMany({
          where: {
            ingredientId: ingredient.id,
            type: "OUT",
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        const totalConsumed = movements.reduce(
          (sum, m) => sum + Number(m.quantity),
          0,
        );
        const dailyConsumption = movements.length > 0 ? totalConsumed / 30 : 0;
        const current = Number(ingredient.currentStock);
        const daysRemaining =
          dailyConsumption > 0 ? current / dailyConsumption : Infinity;

        const suggestedOrderQuantity =
          dailyConsumption > 0
            ? Math.max(0, dailyConsumption * 14 - current)
            : 0;

        return {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          category: "Ingrediente",
          currentStock: current,
          minStock: Number(ingredient.minStock),
          dailyConsumption: Math.round(dailyConsumption * 100) / 100,
          daysRemaining: isFinite(daysRemaining)
            ? Math.round(daysRemaining)
            : null,
          suggestedOrderQuantity: Math.round(suggestedOrderQuantity),
        };
      }),
    );

    return predictions.filter((p) => p.dailyConsumption > 0);
  }

  async getProductStock(establishmentId: string, ingredientId: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        establishmentId,
      },
    });

    if (!ingredient) {
      throw new Error("Ingrediente não encontrado");
    }

    const recentMovements = await this.prisma.stockMovement.findMany({
      where: { ingredientId: ingredient.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      category: "Ingrediente",
      currentStock: Number(ingredient.currentStock),
      minStock: Number(ingredient.minStock),
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: Number(m.quantity),
        reason: m.reason,
        userName: m.user?.name || "Sistema",
        createdAt: m.createdAt,
      })),
    };
  }

  async createStockMovement(
    establishmentId: string,
    data: {
      productId: string;
      quantity: number;
      type: string;
      reason?: string;
      userId: string;
    },
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: {
        id: data.productId,
        establishmentId,
      },
    });

    if (!ingredient) {
      throw new Error("Ingrediente não encontrado");
    }

    const movement = await this.prisma.stockMovement.create({
      data: {
        establishmentId,
        ingredientId: data.productId,
        type: data.type as any,
        quantity: data.quantity,
        reason: data.reason,
        userId: data.userId,
      },
    });

    const currentStock = Number(ingredient.currentStock);
    const newStock =
      data.type === "IN"
        ? currentStock + data.quantity
        : currentStock - data.quantity;

    await this.prisma.ingredient.update({
      where: { id: data.productId },
      data: {
        currentStock: Math.max(0, newStock),
      },
    });

    return movement;
  }

  async updateProductStock(
    establishmentId: string,
    ingredientId: string,
    data: { minStock?: number; maxStock?: number; unit?: string },
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        establishmentId,
      },
    });

    if (!ingredient) {
      throw new Error("Ingrediente não encontrado");
    }

    return this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.unit && { unit: data.unit }),
      },
    });
  }
}
