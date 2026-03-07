import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

interface PrintOrderData {
  id: string;
  orderNumber: string;
  tableName: string;
  items: Array<{
    productName: string;
    quantity: number;
    observations?: string;
  }>;
  observations?: string;
  createdAt: Date;
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly printerEnabled: boolean;
  private readonly printerIp: string;
  private readonly printerPort: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.printerEnabled =
      this.configService.get<string>("PRINTER_ENABLED") === "true";
    this.printerIp = this.configService.get<string>("PRINTER_IP") || "";
    this.printerPort =
      parseInt(this.configService.get<string>("PRINTER_PORT") || "9100") ||
      9100;

    if (this.printerEnabled) {
      this.logger.log(
        `Impressora habilitada: ${this.printerIp}:${this.printerPort}`,
      );
    } else {
      this.logger.log("Impressora desabilitada - modo de desenvolvimento");
    }
  }

  /**
   * Imprime um pedido na impressora térmica
   */
  async printOrder(orderId: string, establishmentId: string): Promise<void> {
    try {
      const order = await this.getOrderData(orderId, establishmentId);

      if (!order) {
        throw new Error("Pedido não encontrado");
      }

      const printContent = this.formatOrderForPrint(order);

      if (this.printerEnabled) {
        await this.sendToPrinter(printContent);
        this.logger.log(`Pedido ${order.orderNumber} impresso com sucesso`);
      } else {
        // Em desenvolvimento, apenas loga o conteúdo
        this.logger.debug("=== IMPRESSÃO (SIMULADA) ===");
        this.logger.debug(printContent);
        this.logger.debug("=== FIM DA IMPRESSÃO ===");
      }

      // Registra a impressão no banco
      await this.prisma.orderPrint.create({
        data: {
          orderId,
          printedAt: new Date(),
          success: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao imprimir pedido ${orderId}: ${error.message}`,
        error.stack,
      );

      // Registra falha no banco
      await this.prisma.orderPrint.create({
        data: {
          orderId,
          printedAt: new Date(),
          success: false,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Busca dados do pedido para impressão
   */
  private async getOrderData(
    orderId: string,
    establishmentId: string,
  ): Promise<PrintOrderData | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        establishmentId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        comanda: {
          include: {
            table: {
              select: {
                number: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    // Use last 8 characters of order ID as order number
    const orderNumber = order.id.slice(-8).toUpperCase();
    const tableName = order.comanda.table 
      ? `Mesa ${order.comanda.table.number}` 
      : "Sem mesa";

    return {
      id: order.id,
      orderNumber: orderNumber,
      tableName: tableName,
      items: order.items.map((item) => ({
        productName: item.product.name,
        quantity: Number(item.quantity),
        observations: item.observations || undefined,
      })),
      observations: order.observations || undefined,
      createdAt: order.createdAt,
    };
  }

  /**
   * Formata o pedido para impressão térmica (58mm ou 80mm)
   */
  private formatOrderForPrint(order: PrintOrderData): string {
    const width = 32; // Caracteres (58mm) - ajuste para 48 se usar 80mm
    const line = "=".repeat(width);
    const time = order.createdAt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let content = "";

    // Cabeçalho
    content += this.center("NOVO PEDIDO", width) + "\n";
    content += line + "\n";
    content += this.center(`PEDIDO #${order.orderNumber}`, width) + "\n";
    content += this.center(order.tableName, width) + "\n";
    content += this.center(`Horário: ${time}`, width) + "\n";
    content += line + "\n\n";

    // Itens
    order.items.forEach((item) => {
      // Quantidade e nome do produto
      const qtyStr = `${item.quantity}x`;
      const productLine = `${qtyStr} ${item.productName}`;

      if (productLine.length <= width) {
        content += productLine + "\n";
      } else {
        // Quebra linha se for muito longo
        content += qtyStr + "\n";
        content += "   " + item.productName + "\n";
      }

      // Observações do item
      if (item.observations) {
        const obs = this.wrapText("OBS: " + item.observations, width - 3);
        obs.forEach((line) => {
          content += "   " + line + "\n";
        });
      }

      content += "\n";
    });

    // Observações gerais do pedido
    if (order.observations) {
      content += line + "\n";
      content += "OBSERVAÇÕES:\n";
      const obs = this.wrapText(order.observations, width);
      obs.forEach((line) => {
        content += line + "\n";
      });
    }

    // Rodapé
    content += "\n" + line + "\n";
    content += this.center("BOA PRODUÇÃO!", width) + "\n";
    content += line + "\n\n\n";

    return content;
  }

  /**
   * Envia texto para a impressora térmica via rede
   */
  private async sendToPrinter(content: string): Promise<void> {
    if (!this.printerIp) {
      throw new Error("IP da impressora não configurado");
    }

    return new Promise((resolve, reject) => {
      const net = require("net");
      const client = new net.Socket();

      // Comandos ESC/POS
      const ESC = "\x1B";
      const GS = "\x1D";

      // Inicializar impressora
      let escposData = ESC + "@"; // Reset

      // Configurar fonte
      escposData += ESC + "!" + "\x00"; // Fonte padrão

      // Adicionar conteúdo
      escposData += content;

      // Cortar papel (se suportado)
      escposData += GS + "V" + "\x00"; // Corte parcial

      client.connect(this.printerPort, this.printerIp, () => {
        this.logger.debug("Conectado à impressora");
        client.write(escposData);
      });

      client.on("data", (data) => {
        this.logger.debug("Resposta da impressora:", data.toString());
        client.destroy();
        resolve();
      });

      client.on("close", () => {
        this.logger.debug("Conexão com impressora encerrada");
        resolve();
      });

      client.on("error", (error) => {
        this.logger.error("Erro na conexão com impressora:", error);
        reject(error);
      });

      // Timeout de 5 segundos
      client.setTimeout(5000, () => {
        client.destroy();
        reject(new Error("Timeout ao conectar com impressora"));
      });
    });
  }

  /**
   * Centraliza texto
   */
  private center(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  }

  /**
   * Quebra texto em múltiplas linhas
   */
  private wrapText(text: string, width: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Lista impressões de um pedido
   */
  async getPrintHistory(
    orderId: string,
    establishmentId: string,
  ): Promise<any[]> {
    // Verifica se o pedido pertence ao estabelecimento
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        establishmentId,
      },
    });

    if (!order) {
      return [];
    }

    return this.prisma.orderPrint.findMany({
      where: {
        orderId,
      },
      orderBy: {
        printedAt: "desc",
      },
    });
  }
}
