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
