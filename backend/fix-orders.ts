/**
 * Script pontual: marca como DELIVERED todos os pedidos de comandas já pagas
 * que ficaram presos em READY/PREPARING/PENDING.
 *
 * Rodar uma única vez: npx ts-node fix-orders.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.updateMany({
    where: {
      status: { in: ["READY", "PREPARING", "PENDING"] },
      comanda: { status: { in: ["PAID", "CLOSED"] } },
    },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });

  console.log(`✅ ${result.count} pedido(s) atualizado(s) para DELIVERED.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
