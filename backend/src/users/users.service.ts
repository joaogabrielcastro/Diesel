import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(establishmentId: string) {
    const users = await this.prisma.user.findMany({
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
    return users.map((u) => ({ ...u, role: this.fromDbRole(u.role) }));
  }

  /** Maps frontend role string → DB enum */
  private toDbRole(role: string): any {
    if (!role) return "WAITER";

    // Normalize input
    const normalized = role.toLowerCase().trim();

    const map: Record<string, string> = {
      admin: "ADMIN",
      garcom: "WAITER",
      waiter: "WAITER",
      cozinha: "KITCHEN",
      kitchen: "KITCHEN",
      caixa: "CASHIER",
      cashier: "CASHIER",
    };

    // Map or fallback to uppercase
    const mapped = map[normalized] ?? normalized.toUpperCase();
    return mapped;
  }

  /** Maps DB enum → frontend role string */
  private fromDbRole(role: string): string {
    const map: Record<string, string> = {
      ADMIN: "admin",
      WAITER: "garcom",
      KITCHEN: "cozinha",
      CASHIER: "caixa",
    };
    return map[role] ?? role.toLowerCase();
  }

  async create(establishmentId: string, data: any) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const dbRole = this.toDbRole(data.role);

      const created = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: dbRole,
          password: hashedPassword,
          establishmentId,
          active: true,
        },
        select: { id: true, name: true, email: true, role: true, active: true },
      });
      return { ...created, role: this.fromDbRole(created.role) };
    } catch (e) {
      console.error("Error creating user:", e);
      throw e;
    }
  }

  async update(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.password)
      updateData.password = await bcrypt.hash(data.password, 10);
    if (data.role) updateData.role = this.toDbRole(data.role);
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return { ...updated, role: this.fromDbRole(updated.role) };
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    const updated = await this.prisma.user.update({
      where: { id },
      data: { active: !user?.active },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return { ...updated, role: this.fromDbRole(updated.role) };
  }
}
