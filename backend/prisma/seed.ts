import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");
  console.log("");

  // Create default plan (required for establishments)
  const starterPlan = await prisma.plan.upsert({
    where: { id: "starter-plan" },
    update: {},
    create: {
      id: "starter-plan",
      name: "STARTER",
      price: 0,
      maxUsers: 10,
      maxTables: 20,
      features: ["basic_orders", "basic_reports", "stock_control"],
      active: true,
    },
  });

  console.log("✅ Created STARTER plan");
  console.log("");
  console.log("🎉 Seed completed!");
  console.log("");
  console.log("📝 Next steps:");
  console.log("   1. Start the application");
  console.log("   2. Create your establishment and first admin user");
  console.log("   3. Configure your categories, products, and tables");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
