import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  /**
   * Salva o logo do estabelecimento
   */
  async saveLogo(
    establishmentId: string,
    filename: string,
    originalname: string,
  ) {
    // Buscar estabelecimento
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
    });

    if (!establishment) {
      throw new Error("Estabelecimento não encontrado");
    }

    // Deletar logo anterior se existir
    if (establishment.logo) {
      const oldLogoPath = path.join(
        process.cwd(),
        "uploads",
        establishment.logo,
      );
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Atualizar no banco
    const updated = await this.prisma.establishment.update({
      where: { id: establishmentId },
      data: {
        logo: filename,
      },
    });

    return {
      filename,
      originalname,
      url: `/uploads/${filename}`,
    };
  }

  /**
   * Salva imagem de produto
   */
  async saveProductImage(
    productId: string,
    establishmentId: string,
    filename: string,
    originalname: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        establishmentId,
      },
    });

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    // Deletar imagem anterior se existir
    if (product.image) {
      const oldImagePath = path.join(process.cwd(), "uploads", product.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Atualizar no banco
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        image: filename,
      },
    });

    return {
      filename,
      originalname,
      url: `/uploads/${filename}`,
    };
  }

  /**
   * Deleta um arquivo
   */
  async deleteFile(filename: string) {
    const filePath = path.join(process.cwd(), "uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, message: "Arquivo deletado" };
    }
    throw new Error("Arquivo não encontrado");
  }
}
