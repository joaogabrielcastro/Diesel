import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsService } from "./payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    comanda: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    table: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("closeTableAccount", () => {
    const tableId = "table-123";
    const establishmentId = "establishment-123";
    const paymentMethod = "CARD" as const;

    const mockTable = {
      id: tableId,
      establishmentId,
      comandas: [
        {
          id: "comanda-123",
          status: "OPEN",
          orders: [
            {
              id: "order-1",
              status: "DELIVERED",
              items: [{ price: 25.0, quantity: 2 }],
            },
          ],
        },
      ],
    };

    it("should close table and create payment successfully", async () => {
      mockPrismaService.table.findFirst = jest
        .fn()
        .mockResolvedValue(mockTable);
      mockPrismaService.comanda.update = jest.fn();
      mockPrismaService.order.updateMany = jest.fn();
      mockPrismaService.payment.create = jest.fn().mockResolvedValue({
        id: "payment-123",
        method: "CREDIT_CARD",
      });

      const result = await service.closeTableAccount(
        tableId,
        establishmentId,
        paymentMethod,
      );

      expect(result).toMatchObject({
        success: true,
        paymentMethod: "CARD",
      });
    });

    it("should throw error if no open comandas", async () => {
      mockPrismaService.table.findFirst = jest.fn().mockResolvedValue({
        ...mockTable,
        comandas: [],
      });

      await expect(
        service.closeTableAccount(tableId, establishmentId, paymentMethod),
      ).rejects.toThrow();
    });
  });
});
