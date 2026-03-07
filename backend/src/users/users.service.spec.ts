import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

describe("UsersService", () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const establishmentId = "establishment-123";
    const createUserDto = {
      name: "João Silva",
      email: "joao@example.com",
      password: "senha123",
      role: "WAITER" as const,
    };

    it("should create a user successfully", async () => {
      const hashedPassword = "hashed_senha123";
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const mockCreatedUser = {
        id: "user-123",
        name: createUserDto.name,
        email: createUserDto.email,
        role: "WAITER", // DB role
        establishmentId,
        active: true,
      };

      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(establishmentId, createUserDto);

      expect(result).toMatchObject({
        id: "user-123",
        name: createUserDto.name,
        email: createUserDto.email,
        role: "garcom", // Converted role
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it("should handle duplicate email (DB constraint)", async () => {
      mockPrismaService.user.create.mockRejectedValue(
        new Error("Unique constraint failed"),
      );

      await expect(
        service.create(establishmentId, createUserDto),
      ).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    const establishmentId = "establishment-123";

    it("should return all users from establishment", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "João",
          email: "joao@example.com",
          role: "WAITER",
          isActive: true,
          password: "hashed123",
        },
        {
          id: "user-2",
          name: "Maria",
          email: "maria@example.com",
          role: "KITCHEN",
          isActive: true,
          password: "hashed456",
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(establishmentId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { establishmentId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });
    });
  });

  describe("update", () => {
    const userId = "user-123";
    const updateData = {
      name: "João Silva Updated",
      role: "ADMIN" as const,
    };

    it("should update user successfully", async () => {
      const mockExistingUser = {
        id: userId,
        name: "João Silva Updated",
        email: "joao@example.com",
        role: "ADMIN",
        active: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockExistingUser);

      const result = await service.update(userId, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.role).toBe("admin"); // Converted role
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          name: updateData.name,
          role: "ADMIN",
        }),
        select: expect.any(Object),
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockPrismaService.user.update.mockRejectedValue(
        new NotFoundException("User not found"),
      );

      await expect(service.update(userId, updateData)).rejects.toThrow();
    });

    it("should hash password when updating", async () => {
      const updateWithPassword = {
        password: "newpassword123",
      };

      const hashedPassword = "hashed_newpassword123";
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        name: "João",
        email: "joao@example.com",
        role: "WAITER",
        active: true,
      });

      await service.update(userId, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword },
        select: expect.any(Object),
      });
    });
  });

  describe("toggleActive", () => {
    const userId = "user-123";

    it("should toggle user active status", async () => {
      const mockUser = {
        id: userId,
        active: true,
        role: "WAITER",
        email: "joao@example.com",
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const result = await service.toggleActive(userId);

      expect(result.active).toBe(false);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { active: false },
        select: expect.any(Object),
      });
    });
  });

  describe("delete", () => {
    const userId = "user-123";

    it("should delete user successfully", async () => {
      mockPrismaService.user.delete.mockResolvedValue({ id: userId });

      await service.delete(userId);

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockPrismaService.user.delete.mockRejectedValue(
        new NotFoundException("User not found"),
      );

      await expect(service.delete(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
