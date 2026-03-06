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

    // Buscar produtos com controle de estoque direto
    const products = await this.prisma.product.findMany({
      where: {
        establishmentId,
        stockControl: true,
      },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    const ingredientItems = ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      ingredientType: (ingredient as any).ingredientType ?? "OUTRO",
      category: "Ingrediente",
      currentStock: Number(ingredient.currentStock),
      minStock: Number(ingredient.minStock),
      maxStock: Number(ingredient.minStock) * 3,
      needsRestock:
        Number(ingredient.currentStock) <= Number(ingredient.minStock),
    }));

    const productItems = products.map((product) => ({
      id: product.id,
      name: product.name,
      unit: product.stockUnit || "un",
      ingredientType: product.category?.name || "OUTRO",
      category: product.category?.name || "Produto Pronto",
      currentStock: Number(product.stockQuantity || 0),
      minStock: Number(product.minStock || 0),
      maxStock: Number(product.minStock || 0) * 3,
      needsRestock:
        Number(product.stockQuantity || 0) <= Number(product.minStock || 0),
    }));

    return [...ingredientItems, ...productItems];
  }

  async getLowStockProducts(establishmentId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { establishmentId },
      orderBy: { currentStock: "asc" },
    });

    const products = await this.prisma.product.findMany({
      where: {
        establishmentId,
        stockControl: true,
      },
      include: {
        category: true,
      },
      orderBy: { stockQuantity: "asc" },
    });

    const lowIngredients = ingredients
      .filter((i) => Number(i.currentStock) <= Number(i.minStock))
      .map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        category: "Ingrediente",
        currentStock: Number(ingredient.currentStock),
        minStock: Number(ingredient.minStock),
      }));

    const lowProducts = products
      .filter((p) => Number(p.stockQuantity || 0) <= Number(p.minStock || 0))
      .map((product) => ({
        id: product.id,
        name: product.name,
        unit: product.stockUnit || "un",
        category: product.category?.name || "Produto Pronto",
        currentStock: Number(product.stockQuantity || 0),
        minStock: Number(product.minStock || 0),
      }));

    return [...lowIngredients, ...lowProducts];
  }

  async getStockAlerts(establishmentId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { establishmentId },
    });

    const products = await this.prisma.product.findMany({
      where: {
        establishmentId,
        stockControl: true,
      },
      include: {
        category: true,
      },
    });

    const critical: any[] = [];
    const warning: any[] = [];
    const attention: any[] = [];

    // Check ingredients
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

    // Check products with direct stock control
    for (const product of products) {
      const current = Number(product.stockQuantity || 0);
      const min = Number(product.minStock || 0);

      if (current === 0) {
        critical.push({
          id: product.id,
          name: product.name,
          unit: product.stockUnit || "un",
          currentStock: current,
          minStock: min,
          category: product.category?.name || "Produto Pronto",
        });
      } else if (min > 0 && current <= min * 0.5) {
        warning.push({
          id: product.id,
          name: product.name,
          unit: product.stockUnit || "un",
          currentStock: current,
          minStock: min,
          category: product.category?.name || "Produto Pronto",
        });
      } else if (min > 0 && current <= min) {
        attention.push({
          id: product.id,
          name: product.name,
          unit: product.stockUnit || "un",
          currentStock: current,
          minStock: min,
          category: product.category?.name || "Produto Pronto",
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

  async createIngredient(
    establishmentId: string,
    data: {
      name: string;
      unit: string;
      minStock: number;
      currentStock: number;
      ingredientType?: string;
    },
  ) {
    return this.prisma.ingredient.create({
      data: {
        establishmentId,
        name: data.name,
        unit: data.unit,
        minStock: data.minStock,
        currentStock: data.currentStock,
        ...(data.ingredientType
          ? ({ ingredientType: data.ingredientType } as any)
          : {}),
      },
    });
  }

  async deleteIngredient(establishmentId: string, ingredientId: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: ingredientId, establishmentId },
    });

    if (!ingredient) {
      throw new Error("Ingrediente não encontrado");
    }

    return this.prisma.ingredient.delete({ where: { id: ingredientId } });
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
