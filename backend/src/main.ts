import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import helmet from "helmet";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get("PORT") || 3000;
  const corsOrigin = configService.get("CORS_ORIGIN") || "*";

  // Parse CORS_ORIGIN - se tiver vírgulas, divide em array
  const allowedOrigins =
    corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim());

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

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

  // Global exception filter - traduz erros para português
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS - configuração dinâmica para aceitar Vercel preview URLs
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      // If wildcard, allow all
      if (corsOrigin === "*") return callback(null, true);

      // Check if origin is in allowed list
      const allowed = allowedOrigins.includes(origin);
      if (allowed) return callback(null, true);

      // Check if origin matches Vercel preview pattern
      if (origin.includes(".vercel.app") && origin.includes("diesel-web")) {
        return callback(null, true);
      }

      // Reject all others
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api");

  await app.listen(port);
  console.log(`🚀 Diesel Bar API running on http://localhost:${port}/api`);
}

bootstrap();
