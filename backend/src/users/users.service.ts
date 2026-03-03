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
  private toDbRole(role: string): string {
    const map: Record<string, string> = {
      admin: "ADMIN",
      garcom: "WAITER",
      cozinha: "KITCHEN",
      caixa: "CASHIER",
    };
    return map[role] ?? role.toUpperCase();
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
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const created = await this.prisma.user.create({
      data: {
        ...data,
        role: this.toDbRole(data.role),
        password: hashedPassword,
        establishmentId,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return { ...created, role: this.fromDbRole(created.role) };
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
