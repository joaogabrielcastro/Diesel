import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get("PORT") || 3000;
  const corsOrigin = configService.get("CORS_ORIGIN") || "*";

  // Parse CORS_ORIGIN - se tiver vírgulas, divide em array
  const allowedOrigins =
    corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim());

  // Servir arquivos estáticos (uploads)
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  // Global pipes - whitelist remove campos extras, transform converte tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // CORS - configuração correta para múltiplas origens
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api");

  await app.listen(port);
  console.log(`🚀 Diesel Bar API running on http://localhost:${port}/api`);
}

bootstrap();
