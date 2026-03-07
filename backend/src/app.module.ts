import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { EstablishmentsModule } from "./establishments/establishments.module";
import { TablesModule } from "./tables/tables.module";
import { ComandasModule } from "./comandas/comandas.module";
import { ProductsModule } from "./products/products.module";
import { CategoriesModule } from "./categories/categories.module";
import { OrdersModule } from "./orders/orders.module";
import { StockModule } from "./stock/stock.module";
import { PaymentsModule } from "./payments/payments.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { ReportsModule } from "./reports/reports.module";
import { UploadModule } from "./upload/upload.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting - 10 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests
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
    ReportsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
