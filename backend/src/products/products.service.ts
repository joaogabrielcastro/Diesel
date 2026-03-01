import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(establishmentId: string, createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        establishmentId,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(establishmentId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        establishmentId,
        ...(categoryId && { categoryId }),
        active: true,
      },
      include: {
        category: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        establishmentId,
      },
      include: {
        category: true,
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  async update(
    id: string,
    establishmentId: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        establishmentId,
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        establishmentId,
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }

  async search(establishmentId: string, query: string) {
    return this.prisma.product.findMany({
      where: {
        establishmentId,
        active: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
      },
      take: 20,
    });
  }
}
