import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "Diesel Bar API",
      version: "1.0.0",
      status: "running",
      message: "API is working! Access /api for endpoints",
      endpoints: {
        auth: "/api/auth/login",
        products: "/api/products",
        orders: "/api/orders",
        tables: "/api/tables",
        payments: "/api/payments",
        reports: "/api/reports",
      },
      documentation: "https://diesel-0i1m.onrender.com/api",
    };
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
