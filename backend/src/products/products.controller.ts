import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Request() req, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(
      req.user.establishmentId,
      createProductDto,
    );
  }

  @Get()
  findAll(@Request() req, @Query("categoryId") categoryId?: string) {
    return this.productsService.findAll(req.user.establishmentId, categoryId);
  }

  @Get("search")
  search(@Request() req, @Query("q") query: string) {
    return this.productsService.search(req.user.establishmentId, query);
  }

  @Get(":id")
  findOne(@Request() req, @Param("id") id: string) {
    return this.productsService.findOne(id, req.user.establishmentId);
  }

  @Patch(":id")
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      id,
      req.user.establishmentId,
      updateProductDto,
    );
  }

  @Delete(":id")
  remove(@Request() req, @Param("id") id: string) {
    return this.productsService.remove(id, req.user.establishmentId);
  }
}
