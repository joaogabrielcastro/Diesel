import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComandasService {
  constructor(private prisma: PrismaService) {}

  async create(establishmentId: string, data: { tableId?: string; customerName?: string }) {
    const comanda = await this.prisma.comanda.create({
      data: {
        establishmentId,
        tableId: data.tableId,
        customerName: data.customerName,
        status: 'OPEN',
      },
      include: {
        table: true,
      },
    });

    // Update table status if tableId provided
    if (data.tableId) {
      await this.prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    return comanda;
  }

  async findAll(establishmentId: string, status?: string) {
    return this.prisma.comanda.findMany({
      where: {
        establishmentId,
        ...(status && { status: status as any }),
      },
      include: {
        table: true,
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
      orderBy: {
        openedAt: 'desc',
      },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const comanda = await this.prisma.comanda.findFirst({
      where: {
        id,
        establishmentId,
      },
      include: {
        table: true,
        orders: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        payments: true,
      },
    });

    if (!comanda) {
      throw new NotFoundException('Comanda not found');
    }

    return comanda;
  }

  async close(id: string, establishmentId: string) {
    const comanda = await this.prisma.comanda.findFirst({
      where: {
        id,
        establishmentId,
      },
      include: {
        table: true,
      },
    });

    if (!comanda) {
      throw new NotFoundException('Comanda not found');
    }

    const updated = await this.prisma.comanda.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    // Update table status
    if (comanda.tableId) {
      await this.prisma.table.update({
        where: { id: comanda.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  }
}
