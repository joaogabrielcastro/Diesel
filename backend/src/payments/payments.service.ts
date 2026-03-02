import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtém o relatório de consumo de uma mesa específica
   */
  async getTableConsumption(tableId: string, establishmentId: string) {
    // Buscar mesa com comandas abertas
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        establishmentId,
      },
      include: {
        comandas: {
          where: {
            status: "OPEN",
          },
          include: {
            orders: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!table) {
      throw new Error("Mesa não encontrada");
    }

    // Calcular total consumido
    let totalAmount = 0;
    const itemsBreakdown: any[] = [];
    const ordersByComanda: any[] = [];

    table.comandas.forEach((comanda) => {
      let comandaTotal = 0;
      const comandaItems: any[] = [];

      comanda.orders.forEach((order) => {
        order.items.forEach((item) => {
          const itemTotal = Number(item.price) * item.quantity;
          totalAmount += itemTotal;
          comandaTotal += itemTotal;

          const existingItem = itemsBreakdown.find(
            (i) => i.productId === item.productId,
          );

          if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.total += itemTotal;
          } else {
            itemsBreakdown.push({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: Number(item.price),
              total: itemTotal,
            });
          }

          comandaItems.push({
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.price),
            total: itemTotal,
          });
        });
      });

      ordersByComanda.push({
        comandaId: comanda.id,
        items: comandaItems,
        subtotal: comandaTotal,
      });
    });

    return {
      table: {
        id: table.id,
        number: table.number,
      },
      totalAmount,
      itemsBreakdown,
      ordersByComanda,
      openComandas: table.comandas.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Obtém relatório de todas as mesas ativas
   */
  async getAllActiveTablesConsumption(establishmentId: string) {
    const tables = await this.prisma.table.findMany({
      where: {
        establishmentId,
        status: "OCCUPIED",
      },
      include: {
        comandas: {
          where: {
            status: "OPEN",
          },
          include: {
            orders: {
              include: {
                items: true,
              },
            },
          },
        },
      },
      orderBy: {
        number: "asc",
      },
    });

    const tablesWithConsumption = tables.map((table) => {
      let totalAmount = 0;
      let totalItems = 0;

      table.comandas.forEach((comanda) => {
        comanda.orders.forEach((order) => {
          order.items.forEach((item) => {
            totalAmount += Number(item.price) * item.quantity;
            totalItems += item.quantity;
          });
        });
      });

      return {
        tableId: table.id,
        tableNumber: table.number,
        totalAmount,
        totalItems,
        openComandas: table.comandas.length,
      };
    });

    return {
      tables: tablesWithConsumption,
      totalTables: tablesWithConsumption.length,
      totalRevenue: tablesWithConsumption.reduce(
        (sum, t) => sum + t.totalAmount,
        0,
      ),
      generatedAt: new Date(),
    };
  }

  /**
   * Marca comandas como pagas (fecha a conta)
   */
  async closeTableAccount(
    tableId: string,
    establishmentId: string,
    paymentMethod: "CASH" | "CARD" | "PIX",
  ) {
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        establishmentId,
      },
      include: {
        comandas: {
          where: {
            status: "OPEN",
          },
        },
      },
    });

    if (!table || table.comandas.length === 0) {
      throw new Error("Mesa não possui comandas abertas");
    }

    // Atualizar status das comandas
    await this.prisma.comanda.updateMany({
      where: {
        tableId,
        status: "OPEN",
      },
      data: {
        status: "PAID",
      },
    });

    // Atualizar status da mesa
    await this.prisma.table.update({
      where: { id: tableId },
      data: {
        status: "AVAILABLE",
      },
    });

    return {
      success: true,
      message: `Mesa ${table.number} fechada com sucesso`,
      paymentMethod,
      closedAt: new Date(),
    };
  }
}
