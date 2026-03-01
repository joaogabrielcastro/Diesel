import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(establishmentId: string) {
    return this.prisma.table.findMany({
      where: { establishmentId },
      include: {
        comandas: {
          where: { status: 'OPEN' },
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  async create(establishmentId: string, data: any) {
    return this.prisma.table.create({
      data: { ...data, establishmentId },
    });
  }

  async updateStatus(id: string, establishmentId: string, status: string) {
    return this.prisma.table.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
