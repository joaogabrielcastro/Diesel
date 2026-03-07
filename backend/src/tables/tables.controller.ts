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
import { TablesService } from "./tables.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTableDto, UpdateTableStatusDto } from "./dto/table.dto";

@Controller("tables")
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll(@Request() req) {
    return this.tablesService.findAll(req.user.establishmentId);
  }

  @Post()
  create(@Request() req, @Body() data: CreateTableDto) {
    return this.tablesService.create(req.user.establishmentId, data);
  }

  @Patch(":id/status")
  updateStatus(
    @Request() req,
    @Param("id") id: string,
    @Body() body: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(
      id,
      req.user.establishmentId,
      body.status,
    );
  }

  @Delete(":id")
  deleteTable(@Request() req, @Param("id") id: string) {
    return this.tablesService.deleteTable(id, req.user.establishmentId);
  }
}
