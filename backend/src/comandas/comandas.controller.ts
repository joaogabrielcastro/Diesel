import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ComandasService } from "./comandas.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("comandas")
@UseGuards(JwtAuthGuard)
export class ComandasController {
  constructor(private readonly comandasService: ComandasService) {}

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.comandasService.create(req.user.establishmentId, data);
  }

  @Get()
  findAll(@Request() req, @Query("status") status?: string) {
    return this.comandasService.findAll(req.user.establishmentId, status);
  }

  @Get("table/:tableId")
  findByTable(@Request() req, @Param("tableId") tableId: string) {
    return this.comandasService.findByTable(tableId, req.user.establishmentId);
  }

  @Get(":id")
  findOne(@Request() req, @Param("id") id: string) {
    return this.comandasService.findOne(id, req.user.establishmentId);
  }

  @Patch(":id/close")
  close(@Request() req, @Param("id") id: string) {
    return this.comandasService.close(id, req.user.establishmentId);
  }
}
