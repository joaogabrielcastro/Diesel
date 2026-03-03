import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { establishment: true },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (!user.active) {
      throw new UnauthorizedException("Usuário inativo");
    }

    const { password: _, ...result } = user;
    return result;
  }

  /** Maps DB enum role → frontend role string */
  private mapRole(role: string): string {
    const map: Record<string, string> = {
      ADMIN: "admin",
      WAITER: "garcom",
      KITCHEN: "cozinha",
      CASHIER: "caixa",
    };
    return map[role] ?? role.toLowerCase();
  }

  async login(user: any) {
    const role = this.mapRole(user.role);
    const payload = {
      sub: user.id,
      email: user.email,
      role,
      establishmentId: user.establishmentId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        establishmentId: user.establishmentId,
        establishment: user.establishment,
      },
    };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    establishmentName: string;
    planId?: string;
  }) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new UnauthorizedException("Email já cadastrado");
    }

    // Get default plan
    let planId = data.planId;
    if (!planId) {
      const defaultPlan = await this.prisma.plan.findFirst({
        where: { name: "STARTER" },
      });
      planId = defaultPlan?.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create establishment and admin user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const establishment = await tx.establishment.create({
        data: {
          name: data.establishmentName,
          email: data.email,
          planId: planId!,
          status: "TRIAL",
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: "ADMIN",
          establishmentId: establishment.id,
        },
        include: {
          establishment: true,
        },
      });

      return user;
    });

    return this.login(result);
  }
}
