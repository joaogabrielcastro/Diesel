import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { EstablishmentsService } from "./establishments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateEstablishmentDto } from "./dto/establishment.dto";

@Controller("establishments")
export class EstablishmentsController {
  constructor(private readonly service: EstablishmentsService) {}

  // Rota pública para obter informações básicas do estabelecimento (logo e nome)
  @Get("info")
  getPublicInfo() {
    return this.service.getPublicInfo();
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  update(@Param("id") id: string, @Body() data: UpdateEstablishmentDto) {
    return this.service.update(id, data);
  }
}
