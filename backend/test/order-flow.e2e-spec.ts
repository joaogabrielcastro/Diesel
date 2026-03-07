import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";

describe("Order Flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let establishmentId: string;
  let tableId: string;
  let comandaId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add validation pipe like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix("api");

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create plan first (required for establishment)
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan",
        maxUsers: 10,
        maxTables: 20,
        features: {},
        price: 99.99,
      },
    });

    // Create establishment
    const establishment = await prisma.establishment.create({
      data: {
        name: "Test Restaurant E2E",
        email: "test@restaurant.com",
        planId: plan.id,
        logo: "test-logo.png",
      },
    });
    establishmentId = establishment.id;

    // Create admin user
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.create({
      data: {
        name: "Admin Test",
        email: "admin.e2e@test.com",
        password: hashedPassword,
        role: "ADMIN",
        establishmentId: establishment.id,
      },
    });

    // Create category
    const category = await prisma.category.create({
      data: {
        name: "Test Category",
        establishmentId: establishment.id,
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        name: "Test Burger",
        price: 25.0,
        description: "Delicious test burger",
        categoryId: category.id,
        establishmentId: establishment.id,
      },
    });
    productId = product.id;

    // Create table
    const table = await prisma.table.create({
      data: {
        number: "E2E-1",
        capacity: 4,
        status: "AVAILABLE",
        establishmentId: establishment.id,
      },
    });
    tableId = table.id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "admin.e2e@test.com",
        password: "admin123",
      });

    authToken = loginResponse.body.access_token;
  }

  async function cleanupTestData() {
    if (establishmentId) {
      await prisma.orderItem.deleteMany({
        where: { order: { comanda: { establishmentId } } },
      });
      await prisma.order.deleteMany({
        where: { comanda: { establishmentId } },
      });
      await prisma.payment.deleteMany({
        where: { comanda: { establishmentId } },
      });
      await prisma.comanda.deleteMany({
        where: { establishmentId },
      });
      await prisma.product.deleteMany({
        where: { establishmentId },
      });
      await prisma.category.deleteMany({
        where: { establishmentId },
      });
      await prisma.table.deleteMany({
        where: { establishmentId },
      });
      await prisma.user.deleteMany({
        where: { establishmentId },
      });
      await prisma.establishment.delete({
        where: { id: establishmentId },
      });
    }
  }

  describe("Complete order flow", () => {
    it("1. Should create a comanda", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/comandas")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tableId: tableId,
          customerName: "Test Customer",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.status).toBe("OPEN");
      expect(response.body.tableId).toBe(tableId);
      comandaId = response.body.id;
    });

    it("2. Should create an order", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          items: [
            {
              productId: productId,
              quantity: 2,
            },
          ],
          observations: "No onions",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.status).toBe("PENDING");
      expect(response.body.items).toHaveLength(1);
      expect(response.body.totalAmount).toBe(50.0); // 2 * 25
      orderId = response.body.id;
    });

    it("3. Should update order status to PREPARING", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "PREPARING",
        })
        .expect(200);

      expect(response.body.status).toBe("PREPARING");
    });

    it("4. Should update order status to READY", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "READY",
        })
        .expect(200);

      expect(response.body.status).toBe("READY");
    });

    it("5. Should update order status to DELIVERED", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "DELIVERED",
        })
        .expect(200);

      expect(response.body.status).toBe("DELIVERED");
    });

    it("6. Should get comanda with total", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/comandas/${comandaId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(comandaId);
      expect(response.body.status).toBe("OPEN");
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.total).toBe(50.0);
    });

    it("7. Should close table and create payment", async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/payments/table/${tableId}/close`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          paymentMethod: "CREDIT_CARD",
          discount: 0,
          observations: "Payment by card",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.status).toBe("COMPLETED");
      expect(response.body.amount).toBe(50.0);
      expect(response.body.finalAmount).toBe(50.0);
      expect(response.body.paymentMethod).toBe("CREDIT_CARD");
    });

    it("8. Should verify comanda is closed", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/comandas/${comandaId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe("CLOSED");
    });

    it("9. Should fail to create order on closed comanda", async () => {
      await request(app.getHttpServer())
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          items: [
            {
              productId: productId,
              quantity: 1,
            },
          ],
        })
        .expect(400);
    });
  });

  describe("Validation tests", () => {
    it("Should fail to create order without items", async () => {
      // Create new comanda for this test
      const comandaResponse = await request(app.getHttpServer())
        .post("/api/comandas")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tableId: tableId,
        });

      await request(app.getHttpServer())
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comandaId: comandaResponse.body.id,
          items: [],
        })
        .expect(400);
    });

    it("Should fail to create order with invalid productId", async () => {
      const comandaResponse = await request(app.getHttpServer())
        .post("/api/comandas")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tableId: tableId,
        });

      await request(app.getHttpServer())
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comandaId: comandaResponse.body.id,
          items: [
            {
              productId: "invalid-product-id",
              quantity: 1,
            },
          ],
        })
        .expect(400);
    });

    it("Should require authentication", async () => {
      await request(app.getHttpServer()).get("/api/orders").expect(401);
    });
  });
});
