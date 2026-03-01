import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EstablishmentsModule } from './establishments/establishments.module';
import { TablesModule } from './tables/tables.module';
import { ComandasModule } from './comandas/comandas.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { StockModule } from './stock/stock.module';
import { PaymentsModule } from './payments/payments.module';
import { QuickOrdersModule } from './quick-orders/quick-orders.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    
    // Core modules
    PrismaModule,
    AuthModule,
    RealtimeModule,
    
    // Feature modules
    UsersModule,
    EstablishmentsModule,
    TablesModule,
    ComandasModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    StockModule,
    PaymentsModule,
    QuickOrdersModule,
  ],
})
export class AppModule {}
