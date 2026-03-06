import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EstablishmentsService {
  constructor(private prisma: PrismaService) {}

  // Retorna informações públicas do primeiro estabelecimento (logo e nome)
  async getPublicInfo() {
    const establishment = await this.prisma.establishment.findFirst({
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    return establishment || { id: null, name: "Diesel Bar", logo: null };
  }

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
        logo: data.logo,
      },
    });
  }
}
