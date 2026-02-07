import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceCatalogDto {
  @ApiProperty({ example: 'Oil Change' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 80.0 })
  @IsNumber()
  price: number;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsNumber()
  duration: number;
}
