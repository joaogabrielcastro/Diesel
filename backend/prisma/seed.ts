import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default plan
  const starterPlan = await prisma.plan.upsert({
    where: { id: "starter-plan" },
    update: {},
    create: {
      id: "starter-plan",
      name: "STARTER",
      price: 0,
      maxUsers: 2,
      maxTables: 5,
      features: ["basic_orders", "basic_reports"],
      active: true,
    },
  });

  console.log("✅ Created starter plan");

  // Create demo establishment
  const demoEstablishment = await prisma.establishment.upsert({
    where: { id: "demo-establishment" },
    update: {},
    create: {
      id: "demo-establishment",
      name: "Diesel Bar Demo",
      email: "demo@dieselbar.com",
      phone: "(11) 98765-4321",
      planId: starterPlan.id,
      status: "ACTIVE",
    },
  });

  console.log("✅ Created demo establishment");

  // Create demo users
  const hashedPassword = await bcrypt.hash("123456", 10);

  const adminUser = await prisma.user.upsert({
    where: { id: "demo-admin" },
    update: {},
    create: {
      id: "demo-admin",
      establishmentId: demoEstablishment.id,
      name: "Admin Demo",
      email: "admin@demo.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const waiterUser = await prisma.user.upsert({
    where: { id: "demo-waiter" },
    update: {},
    create: {
      id: "demo-waiter",
      establishmentId: demoEstablishment.id,
      name: "Garçom Demo",
      email: "garcom@demo.com",
      password: hashedPassword,
      role: "WAITER",
    },
  });

  console.log("✅ Created demo users");

  // Create categories
  const bebidasCategory = await prisma.category.upsert({
    where: { id: "demo-cat-bebidas" },
    update: {},
    create: {
      id: "demo-cat-bebidas",
      establishmentId: demoEstablishment.id,
      name: "Bebidas",
      icon: "🍺",
      order: 1,
    },
  });

  const comidasCategory = await prisma.category.upsert({
    where: { id: "demo-cat-comidas" },
    update: {},
    create: {
      id: "demo-cat-comidas",
      establishmentId: demoEstablishment.id,
      name: "Comidas",
      icon: "🍔",
      order: 2,
    },
  });

  console.log("✅ Created categories");

  // Create products
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        establishmentId: demoEstablishment.id,
        categoryId: bebidasCategory.id,
        name: "Heineken",
        price: 12.0,
        code: "001",
      },
      {
        establishmentId: demoEstablishment.id,
        categoryId: bebidasCategory.id,
        name: "Coca-Cola",
        price: 8.0,
        code: "002",
      },
      {
        establishmentId: demoEstablishment.id,
        categoryId: bebidasCategory.id,
        name: "Caipirinha",
        price: 18.0,
        code: "003",
      },
      {
        establishmentId: demoEstablishment.id,
        categoryId: comidasCategory.id,
        name: "X-Burger",
        price: 25.0,
        code: "101",
        preparationTime: 15,
      },
      {
        establishmentId: demoEstablishment.id,
        categoryId: comidasCategory.id,
        name: "Batata Frita",
        price: 15.0,
        code: "102",
        preparationTime: 10,
      },
      {
        establishmentId: demoEstablishment.id,
        categoryId: comidasCategory.id,
        name: "Porção de Calabresa",
        price: 35.0,
        code: "103",
        preparationTime: 20,
      },
    ],
  });

  console.log("✅ Created products");

  // Create tables
  await prisma.table.createMany({
    skipDuplicates: true,
    data: [
      {
        establishmentId: demoEstablishment.id,
        number: "1",
        capacity: 4,
        status: "AVAILABLE",
      },
      {
        establishmentId: demoEstablishment.id,
        number: "2",
        capacity: 4,
        status: "AVAILABLE",
      },
      {
        establishmentId: demoEstablishment.id,
        number: "3",
        capacity: 6,
        status: "AVAILABLE",
      },
      {
        establishmentId: demoEstablishment.id,
        number: "4",
        capacity: 2,
        status: "AVAILABLE",
      },
      {
        establishmentId: demoEstablishment.id,
        number: "5",
        capacity: 8,
        status: "AVAILABLE",
      },
    ],
  });

  console.log("✅ Created tables");
  console.log("");
  console.log("🎉 Seed completed!");
  console.log("");
  console.log("📝 Demo credentials:");
  console.log("   Admin: admin@demo.com / 123456");
  console.log("   Waiter: garcom@demo.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
