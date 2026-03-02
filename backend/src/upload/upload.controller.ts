import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UploadService } from "./upload.service";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /upload/logo
   * Upload do logo do estabelecimento
   */
  @Post("logo")
  @UseInterceptors(FileInterceptor("logo"))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }

    return this.uploadService.saveLogo(
      req.user.establishmentId,
      file.filename,
      file.originalname,
    );
  }

  /**
   * POST /upload/product
   * Upload de imagem de produto
   */
  @Post("product")
  @UseInterceptors(FileInterceptor("image"))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("productId") productId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }

    if (!productId) {
      throw new BadRequestException("productId é obrigatório");
    }

    return this.uploadService.saveProductImage(
      productId,
      req.user.establishmentId,
      file.filename,
      file.originalname,
    );
  }
}
