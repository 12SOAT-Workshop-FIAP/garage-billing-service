import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePartDto {
  @ApiProperty({ example: 'Oil Filter' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'FLT-001' })
  @IsString()
  @IsNotEmpty()
  partNumber: string;

  @ApiProperty({ required: false, example: 'Filters' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 35.0 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  costPrice: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  stockQuantity: number;

  @ApiProperty({ required: false, example: 5 })
  @IsNumber()
  @IsOptional()
  minStockLevel?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  supplier?: string;
}
