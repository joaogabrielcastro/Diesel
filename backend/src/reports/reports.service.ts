import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        comanda: {
          establishmentId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "DELIVERED",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const orderTotal = order.items.reduce(
        (itemSum, item) => itemSum + item.quantity * Number(item.price),
        0,
      );
      return sum + orderTotal;
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      period: { startDate, endDate },
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orders: orders.length,
    };
  }

  async getTopSellingProducts(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          comanda: {
            establishmentId,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "DELIVERED",
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const productStats = orderItems.reduce((acc, item) => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
        };
      }
      acc[productId].totalQuantity += item.quantity;
      acc[productId].totalRevenue += item.quantity * Number(item.price);
      acc[productId].orderCount += 1;
      return acc;
    }, {});

    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return topProducts;
  }

  async getRevenueReport(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month" = "day",
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        comanda: {
          establishmentId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "DELIVERED",
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const revenueByPeriod = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekNumber = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNumber}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          revenue: 0,
          orders: 0,
        };
      }

      const orderRevenue = order.items.reduce(
        (sum, item) => sum + item.quantity * Number(item.price),
        0,
      );

      acc[key].revenue += orderRevenue;
      acc[key].orders += 1;

      return acc;
    }, {});

    return Object.values(revenueByPeriod);
  }

  async getOrdersStatusReport(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const orders = await this.prisma.order.groupBy({
      by: ["status"],
      where: {
        comanda: {
          establishmentId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    return orders.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }

  async getPeakHours(establishmentId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        comanda: {
          establishmentId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const ordersByHour = orders.reduce((acc, order) => {
      const hour = new Date(order.createdAt).getHours();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour] += 1;
      return acc;
    }, {});

    return Object.entries(ordersByHour)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        orders: count,
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  async getDashboardStats(establishmentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Orders today
    const ordersToday = await this.prisma.order.count({
      where: {
        comanda: { establishmentId },
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Revenue today
    const ordersWithItems = await this.prisma.order.findMany({
      where: {
        comanda: { establishmentId },
        createdAt: { gte: today, lt: tomorrow },
        status: "DELIVERED",
      },
      include: { items: true },
    });

    const revenueToday = ordersWithItems.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + item.quantity * Number(item.price),
          0,
        )
      );
    }, 0);

    // Active tables
    const activeTables = await this.prisma.table.count({
      where: {
        establishmentId,
        status: "OCCUPIED",
      },
    });

    // Open comandas
    const openComandas = await this.prisma.comanda.count({
      where: {
        establishmentId,
        status: "OPEN",
      },
    });

    // Orders by status today
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ["status"],
      where: {
        comanda: { establishmentId },
        createdAt: { gte: today, lt: tomorrow },
      },
      _count: { id: true },
    });

    return {
      ordersToday,
      revenueToday,
      activeTables,
      openComandas,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    };
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
