import { Test, TestingModule } from "@nestjs/testing";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsService } from "../products/products.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("OrdersService", () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let productsService: ProductsService;

  const mockPrismaService = {
    comanda: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    ingredient: {
      update: jest.fn(),
    },
    orderHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockProductsService = {
    updateStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    productsService = module.get<ProductsService>(ProductsService);

    // Clear mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const userId = "user-123";
    const establishmentId = "establishment-123";
    const comandaId = "comanda-123";

    const createOrderDto = {
      comandaId,
      items: [
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ],
      observations: "Sem cebola",
    };

    const mockComanda = {
      id: comandaId,
      establishmentId,
      status: "OPEN",
      table: { id: "table-1", number: "1" },
    };

    const mockProducts = [
      {
        id: "product-1",
        name: "Hambúrguer",
        price: 25.0,
        establishmentId,
        ingredients: [],
      },
      {
        id: "product-2",
        name: "Cerveja",
        price: 8.0,
        establishmentId,
        ingredients: [],
      },
    ];

    const mockCreatedOrder = {
      id: "order-123",
      comandaId,
      status: "PENDING",
      totalAmount: 58.0,
      items: [
        { productId: "product-1", quantity: 2, unitPrice: 25.0 },
        { productId: "product-2", quantity: 1, unitPrice: 8.0 },
      ],
    };

    it("should create an order successfully", async () => {
      mockPrismaService.comanda.findFirst.mockResolvedValue(mockComanda);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);
      mockPrismaService.comanda.update = jest.fn();

      const result = await service.create(
        userId,
        establishmentId,
        createOrderDto,
      );

      expect(mockPrismaService.comanda.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it("should throw BadRequestException if comanda is not found", async () => {
      mockPrismaService.comanda.findFirst.mockResolvedValue(null);

      await expect(
        service.create(userId, establishmentId, createOrderDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.comanda.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if comanda is not OPEN", async () => {
      mockPrismaService.comanda.findFirst.mockResolvedValue(null);

      await expect(
        service.create(userId, establishmentId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateStatus", () => {
    const orderId = "order-123";
    const establishmentId = "establishment-123";
    const userId = "user-123";
    const updateStatusDto = { status: "PREPARING" as const };

    const mockOrder = {
      id: orderId,
      status: "PENDING",
      comandaId: "comanda-123",
      comanda: {
        establishmentId,
      },
    };

    it("should update order status successfully", async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: "PREPARING",
      });

      const result = await service.updateStatus(
        orderId,
        establishmentId,
        userId,
        updateStatusDto,
      );

      expect(result.status).toBe("PREPARING");
      expect(mockPrismaService.order.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it("should throw NotFoundException when order doesn't exist", async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(orderId, establishmentId, userId, updateStatusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    const establishmentId = "establishment-123";

    it("should return all orders for establishment", async () => {
      const mockOrders = [
        { id: "order-1", status: "PENDING", totalAmount: 50.0 },
        { id: "order-2", status: "PREPARING", totalAmount: 30.0 },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll(establishmentId);

      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: {
          establishmentId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          comanda: {
            include: {
              table: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should filter by status when provided", async () => {
      const mockOrders = [
        { id: "order-1", status: "PENDING", totalAmount: 50.0 },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      await service.findAll(establishmentId, "PENDING");

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        }),
      );
    });
  });
});
