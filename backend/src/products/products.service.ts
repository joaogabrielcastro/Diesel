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

  /**
   * Atualiza o estoque de um produto (entrada/saída manual)
   */
  async updateStock(
    id: string,
    establishmentId: string,
    quantity: number,
    operation: "ADD" | "SUBTRACT" | "SET",
  ) {
    const product = await this.findOne(id, establishmentId);

    if (!product.stockControl) {
      throw new Error("Este produto não possui controle de estoque direto");
    }

    let newQuantity = Number(product.stockQuantity) || 0;

    switch (operation) {
      case "ADD":
        newQuantity += quantity;
        break;
      case "SUBTRACT":
        newQuantity -= quantity;
        if (newQuantity < 0) newQuantity = 0;
        break;
      case "SET":
        newQuantity = quantity;
        break;
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Dá baixa no estoque de produtos com controle direto
   * Chamado quando um pedido é entregue
   */
  async decreaseStock(productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.stockControl) {
      return; // Não faz nada se produto não controla estoque
    }

    const currentStock = Number(product.stockQuantity) || 0;
    const newStock = Math.max(0, currentStock - quantity);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: newStock,
      },
    });

    // TODO: Emitir alerta via WebSocket se estoque abaixo do mínimo
    if (product.minStock && newStock < Number(product.minStock)) {
      console.log(
        `⚠️ ALERTA: Estoque baixo de ${product.name} (${newStock} ${product.stockUnit})`,
      );
    }
  }

  /**
   * Lista produtos com estoque baixo
   */
  async getLowStockProducts(establishmentId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        establishmentId,
        active: true,
        stockControl: true,
      },
      include: {
        category: true,
      },
    });

    return products.filter((product) => {
      if (!product.minStock) return false;
      const current = Number(product.stockQuantity) || 0;
      const min = Number(product.minStock);
      return current <= min;
    });
  }
}
