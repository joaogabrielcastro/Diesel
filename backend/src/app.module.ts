import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { CacheModule, CacheInterceptor } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
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
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Cache with Redis (fallback to memory if Redis unavailable)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get("REDIS_HOST");
        const redisPort = configService.get("REDIS_PORT");

        // If Redis is configured, use it, otherwise fallback to memory cache
        if (redisHost && redisPort) {
          try {
            return {
              store: redisStore as any,
              host: redisHost,
              port: redisPort,
              password: configService.get("REDIS_PASSWORD") || undefined,
              ttl: 300, // 5 minutes default
            };
          } catch (error) {
            console.warn("Redis not available, using memory cache");
            return { ttl: 300 };
          }
        }
        return { ttl: 300 }; // Memory cache fallback
      },
    }),

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
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
