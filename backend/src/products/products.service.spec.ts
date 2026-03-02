import { Test, TestingModule } from "@nestjs/testing";
import { ProductsService } from "./products.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("ProductsService", () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new product", async () => {
      const createDto = {
        categoryId: "cat-1",
        name: "Heineken",
        price: 12.0,
        code: "001",
      };

      const mockProduct = {
        id: "prod-1",
        ...createDto,
        establishmentId: "est-1",
        active: true,
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create("est-1", createDto as any);

      expect(result).toEqual(mockProduct);
    });
  });

  describe("findAll", () => {
    it("should return all products for establishment", async () => {
      const mockProducts = [
        { id: "1", name: "Product 1", establishmentId: "est-1" },
        { id: "2", name: "Product 2", establishmentId: "est-1" },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll("est-1");

      expect(result).toEqual(mockProducts);
      expect(prismaService.product.findMany).toHaveBeenCalled();
    });

    it("should filter by categoryId when provided", async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll("est-1", "cat-1");

      expect(prismaService.product.findMany).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a product by id", async () => {
      const mockProduct = {
        id: "prod-1",
        name: "Heineken",
        establishmentId: "est-1",
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne("est-1", "prod-1");

      expect(result).toEqual(mockProduct);
    });

    it("should throw NotFoundException when product not found", async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne("est-1", "invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
