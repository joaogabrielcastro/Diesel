import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.establishmentId);
  }

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.categoriesService.create(req.user.establishmentId, data);
  }
}
