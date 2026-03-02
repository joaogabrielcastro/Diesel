import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { EstablishmentsService } from "./establishments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("establishments")
@UseGuards(JwtAuthGuard)
export class EstablishmentsController {
  constructor(private readonly service: EstablishmentsService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.service.update(id, data);
  }
}
