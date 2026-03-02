import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthService", () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    plan: {
      findFirst: jest.fn(),
    },
    establishment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should throw UnauthorizedException when user is not found", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.validateUser("notfound@example.com", "123456"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException with invalid password", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        password: "$2a$10$somehashedpassword",
        name: "Test User",
        role: "WAITER",
        active: true,
        establishmentId: "est-1",
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.validateUser("test@example.com", "wrongpassword"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("login", () => {
    it("should return access token and user data", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "WAITER",
        establishmentId: "est-1",
      };

      const mockToken = "mock.jwt.token";
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty("access_token", mockToken);
      expect(result).toHaveProperty("user");
      expect(result.user.email).toBe("test@example.com");
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        establishmentId: mockUser.establishmentId,
        role: mockUser.role,
      });
    });
  });
});
