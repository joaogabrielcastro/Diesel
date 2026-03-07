import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.establishmentId);
  }

  @Post()
  create(@Request() req, @Body() data: CreateCategoryDto) {
    return this.categoriesService.create(req.user.establishmentId, data);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() data: UpdateCategoryDto) {
    return this.categoriesService.update(id, data);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.delete(id);
  }

  @Delete()
  removeAll(@Request() req) {
    return this.categoriesService.deleteAll(req.user.establishmentId);
  }
}
