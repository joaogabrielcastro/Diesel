import { IsString, IsEnum, IsOptional } from "class-validator";

export class CreateComandaDto {
  @IsString()
  tableId: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEnum(["OPEN", "CLOSED"])
  @IsOptional()
  status?: string;
}
