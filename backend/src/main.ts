import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get("PORT") || 3000;
  const corsOrigin = configService.get("CORS_ORIGIN")?.split(",") || "*";

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api");

  await app.listen(port);
  console.log(`🚀 Diesel Bar API running on http://localhost:${port}/api`);
}

bootstrap();
