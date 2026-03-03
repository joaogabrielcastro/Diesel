import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(establishmentId: string) {
    return this.prisma.category.findMany({
      where: { establishmentId, active: true },
      orderBy: { order: "asc" },
    });
  }

  async create(establishmentId: string, data: any) {
    return this.prisma.category.create({
      data: { ...data, establishmentId },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
