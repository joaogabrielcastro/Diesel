import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";
import { ProductsService } from "../products/products.service";
import { PrinterService } from "../printer/printer.service";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private printerService: PrinterService,
  ) {}

  async create(
    userId: string,
    establishmentId: string,
    createOrderDto: CreateOrderDto,
  ) {
    const { comandaId, items, observations } = createOrderDto;

    // Verify comanda exists and belongs to establishment
    const comanda = await this.prisma.comanda.findFirst({
      where: {
        id: comandaId,
        establishmentId,
        status: "OPEN",
      },
      include: {
        table: true,
      },
    });

    if (!comanda) {
      throw new BadRequestException(
        "Não há nenhuma comanda aberta para esta mesa. Por favor, abra uma comanda antes de fazer o pedido.",
      );
    }

    // Get products with prices
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        establishmentId,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException("Some products not found");
    }

    // Verificar estoque disponível antes de criar o pedido
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;

      // Verificar produtos com controle direto de estoque
      if (product.stockControl) {
        const currentStock = Number(product.stockQuantity) || 0;

        if (currentStock < item.quantity) {
          stockErrors.push(
            `${product.name}: estoque insuficiente (disponível: ${currentStock}, solicitado: ${item.quantity})`,
          );
        }
      }
      // Verificar ingredientes do produto
      else if (product.ingredients.length > 0) {
        for (const productIngredient of product.ingredients) {
          const requiredQuantity =
            productIngredient.quantity.toNumber() * item.quantity;
          const available = Number(productIngredient.ingredient.currentStock);

          if (available < requiredQuantity) {
            stockErrors.push(
              `${product.name}: ingrediente "${productIngredient.ingredient.name}" insuficiente (disponível: ${available} ${productIngredient.ingredient.unit}, necessário: ${requiredQuantity} ${productIngredient.ingredient.unit})`,
            );
          }
        }
      }
    }

    // Se houver erros de estoque, lançar exceção
    if (stockErrors.length > 0) {
      throw new BadRequestException({
        message: "Estoque insuficiente para completar o pedido",
        errors: stockErrors,
      });
    }

    // Create order with items in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          establishmentId,
          comandaId,
          userId,
          observations,
          status: "PENDING",
          items: {
            create: items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
                observations: item.observations,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Decrease stock for products
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;

        // Se o produto tem controle de estoque direto, diminuir do stockQuantity
        if (product.stockControl) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
        // Se o produto usa ingredientes, diminuir dos ingredientes
        else if (product.ingredients.length > 0) {
          for (const ingredient of product.ingredients) {
            const quantityToDecrement =
              ingredient.quantity.toNumber() * item.quantity;
            await tx.ingredient.update({
              where: { id: ingredient.ingredientId },
              data: {
                currentStock: {
                  decrement: quantityToDecrement,
                },
              },
            });

            // Log stock movement
            const quantityUsed = ingredient.quantity.toNumber() * item.quantity;
            await tx.stockMovement.create({
              data: {
                establishmentId,
                ingredientId: ingredient.ingredientId,
                userId,
                type: "OUT",
                quantity: quantityUsed,
                reason: `Order ${newOrder.id}`,
              },
            });
          }
        }
      }

      // Update comanda total
      const orderTotal = newOrder.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );

      await tx.comanda.update({
        where: { id: comandaId },
        data: {
          total: {
            increment: orderTotal,
          },
        },
      });

      return newOrder;
    });

    // Try to print order (don't fail if printing fails)
    try {
      await this.printerService.printOrder(order.id, establishmentId);
    } catch (error) {
      console.error("Failed to print order:", error);
      // Continue - order was created successfully
    }

    return order;
  }

  async findAll(establishmentId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        establishmentId,
        ...(status && { status: status as any }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        comanda: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        establishmentId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
        comanda: {
          include: {
            table: true,
          },
        },
        history: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            changedAt: "desc",
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async updateStatus(
    id: string,
    establishmentId: string,
    userId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const { status } = updateOrderStatusDto;

    const order = await this.prisma.order.findFirst({
      where: {
        id,
        establishmentId,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Create history record
      await tx.orderHistory.create({
        data: {
          orderId: id,
          userId,
          oldStatus: order.status,
          newStatus: status,
        },
      });

      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === "PREPARING" && { preparedAt: new Date() }),
          ...(status === "DELIVERED" && { deliveredAt: new Date() }),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          comanda: {
            include: {
              table: true,
            },
          },
        },
      });

      // Se o pedido foi cancelado, devolver o estoque
      if (status === "CANCELLED") {
        for (const item of updated.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          });

          if (product) {
            // Se tem controle direto de estoque, devolver
            if (product.stockControl) {
              await tx.product.update({
                where: { id: product.id },
                data: {
                  stockQuantity: {
                    increment: item.quantity,
                  },
                },
              });
            }
            // Se usa ingredientes, devolver aos ingredientes
            else if (product.ingredients.length > 0) {
              for (const ingredient of product.ingredients) {
                const quantityToReturn =
                  ingredient.quantity.toNumber() * item.quantity;
                await tx.ingredient.update({
                  where: { id: ingredient.ingredientId },
                  data: {
                    currentStock: {
                      increment: quantityToReturn,
                    },
                  },
                });

                // Log stock movement
                await tx.stockMovement.create({
                  data: {
                    establishmentId,
                    ingredientId: ingredient.ingredientId,
                    userId,
                    type: "IN",
                    quantity: quantityToReturn,
                    reason: `Order ${id} cancelled`,
                  },
                });
              }
            }
          }
        }
      }

      return updated;
    });

    return updatedOrder;
  }

  async getKitchenOrders(establishmentId: string) {
    return this.prisma.order.findMany({
      where: {
        establishmentId,
        status: {
          in: ["PENDING", "PREPARING"],
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        comanda: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}
