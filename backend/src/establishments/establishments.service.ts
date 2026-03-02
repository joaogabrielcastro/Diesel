import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EstablishmentsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.establishment.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.establishment.update({
      where: { id },
      data: {
        name: data.name,
        cnpj: data.cnpj,
        phone: data.phone,
        address: data.address,
      },
    });
  }
}
