import { Injectable, BadRequestException } from "@nestjs/common";
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
    // Verificar se há produtos vinculados a esta categoria
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir esta categoria pois existem ${productsCount} produto(s) vinculado(s). Mova os produtos para outra categoria primeiro.`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async deleteAll(establishmentId: string) {
    // Usar transação para garantir que tudo seja deletado ou nada
    return this.prisma.$transaction(async (tx) => {
      // 1. Buscar todos os produtos do estabelecimento
      const products = await tx.product.findMany({
        where: { establishmentId },
        select: { id: true },
      });

      const productIds = products.map((p) => p.id);

      // 2. Deletar OrderItems relacionados aos produtos
      if (productIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: {
            productId: { in: productIds },
          },
        });

        // 3. Deletar ProductIngredients
        await tx.productIngredient.deleteMany({
          where: {
            productId: { in: productIds },
          },
        });
      }

      // 4. Deletar todas as movimentações de estoque do estabelecimento
      await tx.stockMovement.deleteMany({
        where: { establishmentId },
      });

      // 5. Deletar todos os ingredientes do estabelecimento
      await tx.ingredient.deleteMany({
        where: { establishmentId },
      });

      // 6. Deletar todos os produtos
      await tx.product.deleteMany({
        where: { establishmentId },
      });

      // 7. Deletar todas as categorias
      const result = await tx.category.deleteMany({
        where: { establishmentId },
      });

      return result;
    });
  }
}
