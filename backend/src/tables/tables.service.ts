import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(establishmentId: string) {
    return this.prisma.table.findMany({
      where: { establishmentId },
      include: {
        comandas: {
          where: { status: "OPEN" },
        },
      },
      orderBy: { number: "asc" },
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

  async deleteTable(id: string, establishmentId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, establishmentId },
      include: {
        comandas: {
          where: { status: "OPEN" },
        },
      },
    });

    if (!table) {
      throw new NotFoundException("Mesa não encontrada");
    }

    if (table.comandas.length > 0) {
      throw new BadRequestException(
        "Não é possível excluir uma mesa com comanda aberta",
      );
    }

    return this.prisma.table.delete({ where: { id } });
  }
}
