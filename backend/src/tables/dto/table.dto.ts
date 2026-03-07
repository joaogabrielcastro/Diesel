import { IsString, IsNumber, IsEnum, IsOptional, Min } from "class-validator";

export class CreateTableDto {
  @IsString()
  number: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsEnum(["AVAILABLE", "OCCUPIED", "RESERVED"])
  @IsOptional()
  status?: string;
}

export class UpdateTableStatusDto {
  @IsEnum(["AVAILABLE", "OCCUPIED", "RESERVED"])
  status: string;
}
