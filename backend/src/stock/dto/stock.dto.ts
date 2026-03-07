import { IsString, IsNumber, IsEnum, IsOptional, Min } from "class-validator";

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  minStock: number;

  @IsNumber()
  @Min(0)
  currentStock: number;

  @IsEnum(["BEBIDA", "PROTEINA", "VEGETAIS", "GRAOS", "TEMPEROS", "OUTRO"])
  @IsOptional()
  ingredientType?: string;
}

export class CreateStockMovementDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(["IN", "OUT"])
  type: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  userId: string;
}

export class UpdateStockDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;
}
