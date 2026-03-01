import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(establishmentId: string) {
    return this.prisma.user.findMany({
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
  }

  async create(establishmentId: string, data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        establishmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });
  }
}
