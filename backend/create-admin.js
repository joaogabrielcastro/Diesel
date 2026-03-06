const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("🔐 Criando usuário admin...\n");

    // Buscar ou criar um establishment
    let establishment = await prisma.establishment.findFirst();

    if (!establishment) {
      console.log("⚠️  Nenhum establishment encontrado. Criando um...");
      establishment = await prisma.establishment.create({
        data: {
          name: "Diesel Bar",
          cnpj: "00000000000000",
          planId: "starter-plan",
        },
      });
      console.log("✓ Establishment criado!\n");
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        email: "sistema@diesel.com",
        establishmentId: establishment.id,
      },
    });

    if (existingUser) {
      console.log("⚠️  Usuário sistema@diesel.com já existe!");
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nome: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Ativo: ${existingUser.active ? "Sim" : "Não"}\n`);
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Criar usuário admin
    const adminUser = await prisma.user.create({
      data: {
        establishmentId: establishment.id,
        name: "Sistema Admin",
        email: "sistema@diesel.com",
        password: hashedPassword,
        role: "ADMIN",
        active: true,
      },
    });

    console.log("✅ Usuário admin criado com sucesso!\n");
    console.log("📧 Email: sistema@diesel.com");
    console.log("🔑 Senha: 123456");
    console.log(`👤 Nome: ${adminUser.name}`);
    console.log(`🏢 Establishment: ${establishment.name}`);
    console.log(`🆔 ID: ${adminUser.id}\n`);
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
