import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";

describe("Authentication (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/auth/login (POST)", () => {
    it("should login with valid credentials", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "admin@demo.com",
          password: "123456",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("access_token");
          expect(res.body).toHaveProperty("user");
          expect(res.body.user.email).toBe("admin@demo.com");
          authToken = res.body.access_token;
        });
    });

    it("should fail with invalid credentials", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "admin@demo.com",
          password: "wrongpassword",
        })
        .expect(401);
    });

    it("should fail with missing fields", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "admin@demo.com",
        })
        .expect(400);
    });
  });
});

describe("Products (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "admin@demo.com",
        password: "123456",
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/products (GET)", () => {
    it("should return products when authenticated", () => {
      return request(app.getHttpServer())
        .get("/products")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).get("/products").expect(401);
    });
  });

  describe("/products/search (GET)", () => {
    it("should search products by query", () => {
      return request(app.getHttpServer())
        .get("/products/search?q=cerveja")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});

describe("Orders (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "garcom@demo.com",
        password: "123456",
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/orders (GET)", () => {
    it("should return orders when authenticated", () => {
      return request(app.getHttpServer())
        .get("/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe("/orders/kitchen (GET)", () => {
    it("should return kitchen orders", () => {
      return request(app.getHttpServer())
        .get("/orders/kitchen")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────
describe("Categories (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let createdCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@demo.com", password: "123456" });
    authToken = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /categories - should return array", () => {
    return request(app.getHttpServer())
      .get("/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it("POST /categories - should create category", () => {
    return request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Teste E2E", icon: "🧪" })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(res.body.name).toBe("Teste E2E");
        createdCategoryId = res.body.id;
      });
  });

  it("DELETE /categories/:id - should delete category", async () => {
    if (!createdCategoryId) return;
    return request(app.getHttpServer())
      .delete(`/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
  });

  it("GET /categories - should require auth", () => {
    return request(app.getHttpServer()).get("/categories").expect(401);
  });
});

// ─── Tables ───────────────────────────────────────────────────────────────────
describe("Tables (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let createdTableId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@demo.com", password: "123456" });
    authToken = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /tables - should return array", () => {
    return request(app.getHttpServer())
      .get("/tables")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it("POST /tables - should create table", () => {
    return request(app.getHttpServer())
      .post("/tables")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ number: 99, capacity: 4 })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(Number(res.body.number)).toBe(99);
        createdTableId = res.body.id;
      });
  });

  it("DELETE /tables/:id - should delete table", async () => {
    if (!createdTableId) return;
    return request(app.getHttpServer())
      .delete(`/tables/${createdTableId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
  });

  it("GET /tables - should require auth", () => {
    return request(app.getHttpServer()).get("/tables").expect(401);
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
describe("Users (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@demo.com", password: "123456" });
    authToken = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /users - should return array", () => {
    return request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it("POST /users - should create user", () => {
    return request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Garçom Teste",
        email: `garcom-e2e-${Date.now()}@test.com`,
        password: "123456",
        role: "garcom",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(res.body.role).toBe("garcom");
        createdUserId = res.body.id;
      });
  });

  it("PATCH /users/:id/toggle - should toggle active", async () => {
    if (!createdUserId) return;
    return request(app.getHttpServer())
      .patch(`/users/${createdUserId}/toggle`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("active");
        expect(res.body.active).toBe(false);
      });
  });

  it("DELETE /users/:id - should delete user", async () => {
    if (!createdUserId) return;
    return request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
  });
});

// ─── Stock ────────────────────────────────────────────────────────────────────
describe("Stock (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@demo.com", password: "123456" });
    authToken = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /stock - should return array", () => {
    return request(app.getHttpServer())
      .get("/stock")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it("GET /stock - should require auth", () => {
    return request(app.getHttpServer()).get("/stock").expect(401);
  });
});
