import { Test, TestingModule } from "@nestjs/testing";
import { StockService } from "./stock.service";
import { PrismaService } from "../prisma/prisma.service";

describe("StockService", () => {
  let service: StockService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ingredient: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAllStock", () => {
    const establishmentId = "establishment-123";

    const mockIngredients = [
      {
        id: "ingredient-1",
        name: "Carne",
        unit: "kg",
        ingredientType: "PROTEINA",
        currentStock: 5.0,
        minStock: 2.0,
        establishmentId,
      },
      {
        id: "ingredient-2",
        name: "Alface",
        unit: "un",
        ingredientType: "VEGETAIS",
        currentStock: 10.0,
        minStock: 5.0,
        establishmentId,
      },
    ];

    const mockProducts = [
      {
        id: "product-1",
        name: "Hambúrguer",
        stockControl: true,
        stockUnit: "un",
        stockQuantity: 15.0,
        minStock: 5.0,
        establishmentId,
        category: { name: "Lanches" },
      },
    ];

    it("should return all stock items", async () => {
      mockPrismaService.ingredient.findMany.mockResolvedValue(mockIngredients);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getAllStock(establishmentId);

      expect(result).toHaveLength(3); // 2 ingredients + 1 product
      expect(mockPrismaService.ingredient.findMany).toHaveBeenCalledWith({
        where: { establishmentId },
        orderBy: { name: "asc" },
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          establishmentId,
          stockControl: true,
        },
        include: {
          category: true,
        },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("getLowStockProducts", () => {
    const establishmentId = "establishment-123";

    it("should return only items with low stock", async () => {
      const mockIngredients = [
        {
          id: "ingredient-1",
          name: "Carne",
          currentStock: 1.0,
          minStock: 2.0,
          unit: "kg",
          ingredientType: "PROTEINA",
          establishmentId,
        },
      ];

      const mockProducts = [
        {
          id: "product-1",
          name: "Hambúrguer",
          stockQuantity: 3.0,
          minStock: 5.0,
          stockControl: true,
          stockUnit: "un",
          establishmentId,
          category: { name: "Lanches" },
        },
      ];

      mockPrismaService.ingredient.findMany.mockResolvedValue(mockIngredients);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getLowStockProducts(establishmentId);

      expect(result).toHaveLength(2);
      // Verify all items have currentStock <= minStock
      result.forEach((item) => {
        expect(item.currentStock).toBeLessThanOrEqual(item.minStock);
      });
    });
  });

  describe("createIngredient", () => {
    const establishmentId = "establishment-123";
    const ingredientData = {
      name: "Tomate",
      unit: "kg",
      minStock: 2.0,
      currentStock: 5.0,
      ingredientType: "VEGETAIS",
    };

    it("should create ingredient successfully", async () => {
      const mockCreatedIngredient = {
        id: "ingredient-123",
        ...ingredientData,
        establishmentId,
      };

      mockPrismaService.ingredient.create.mockResolvedValue(
        mockCreatedIngredient,
      );

      const result = await service.createIngredient(
        establishmentId,
        ingredientData,
      );

      expect(result).toEqual(mockCreatedIngredient);
      expect(mockPrismaService.ingredient.create).toHaveBeenCalledWith({
        data: {
          ...ingredientData,
          establishmentId,
        },
      });
    });
  });

  describe("createStockMovement", () => {
    const establishmentId = "establishment-123";
    const movementData = {
      productId: "ingredient-1",
      quantity: 5.0,
      type: "IN" as const,
      reason: "Compra",
      userId: "user-123",
    };

    it("should create stock movement and update ingredient stock (IN)", async () => {
      const mockIngredient = {
        id: "ingredient-1",
        currentStock: 10.0,
      };

      const mockMovement = {
        id: "movement-123",
        ...movementData,
        establishmentId,
      };

      mockPrismaService.ingredient.findFirst.mockResolvedValue(mockIngredient);
      mockPrismaService.ingredient.update.mockResolvedValue({
        ...mockIngredient,
        currentStock: 15.0,
      });
      mockPrismaService.stockMovement.create.mockResolvedValue(mockMovement);

      const result = await service.createStockMovement(
        establishmentId,
        movementData,
      );

      expect(result).toEqual(mockMovement);
      expect(mockPrismaService.ingredient.update).toHaveBeenCalledWith({
        where: { id: movementData.productId },
        data: {
          currentStock: 15, // 10 + 5
        },
      });
    });

    it("should decrease stock for OUT movements", async () => {
      const outMovement = {
        ...movementData,
        type: "OUT" as const,
      };
      mockPrismaService.ingredient.findFirst.mockResolvedValue({
        id: "ingredient-1",
        currentStock: 10.0,
      });
      mockPrismaService.ingredient.update.mockResolvedValue({
        id: "ingredient-1",
        currentStock: 5.0,
      });
      mockPrismaService.stockMovement.create.mockResolvedValue({
        id: "movement-123",
        ...outMovement,
      });

      await service.createStockMovement(establishmentId, outMovement);

      expect(mockPrismaService.ingredient.update).toHaveBeenCalledWith({
        where: { id: outMovement.productId },
        data: {
          currentStock: 5, // 10 - 5
        },
      });
    });
  });

  describe("getStockAlerts", () => {
    const establishmentId = "establishment-123";

    it("should return alerts categorized by severity", async () => {
      const mockIngredients = [
        {
          id: "ingredient-1",
          name: "Carne",
          currentStock: 1.0,
          minStock: 2.0,
          unit: "kg",
          ingredientType: "PROTEINA",
          establishmentId,
        },
      ];

      mockPrismaService.ingredient.findMany.mockResolvedValue(mockIngredients);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      const result = await service.getStockAlerts(establishmentId);

      expect(result).toHaveProperty("products");
      expect(result.products).toHaveProperty("warning");
      expect(result.products.warning.length).toBeGreaterThan(0);
    });
  });
});
