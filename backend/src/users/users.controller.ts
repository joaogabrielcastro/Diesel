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
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.establishmentId);
  }

  @Post()
  create(@Request() req, @Body() data: CreateUserDto) {
    return this.usersService.create(req.user.establishmentId, data);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Patch(":id/toggle")
  toggleActive(@Param("id") id: string) {
    return this.usersService.toggleActive(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.delete(id);
  }
}
