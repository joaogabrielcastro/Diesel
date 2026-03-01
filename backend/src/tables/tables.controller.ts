import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { TablesService } from "./tables.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("tables")
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll(@Request() req) {
    return this.tablesService.findAll(req.user.establishmentId);
  }

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.tablesService.create(req.user.establishmentId, data);
  }

  @Patch(":id/status")
  updateStatus(
    @Request() req,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.tablesService.updateStatus(
      id,
      req.user.establishmentId,
      status,
    );
  }
}
