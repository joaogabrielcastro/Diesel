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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(
      req.user.id,
      req.user.establishmentId,
      createOrderDto,
    );
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.ordersService.findAll(req.user.establishmentId, status);
  }

  @Get('kitchen')
  getKitchenOrders(@Request() req) {
    return this.ordersService.getKitchenOrders(req.user.establishmentId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.establishmentId);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      id,
      req.user.establishmentId,
      req.user.id,
      updateOrderStatusDto,
    );
  }
}
