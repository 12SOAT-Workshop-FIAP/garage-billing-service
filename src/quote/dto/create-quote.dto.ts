import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QuoteItemDto {
  @ApiProperty({ example: 'Óleo sintético' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Óleo 5W30 sintético premium' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 45.99 })
  @IsNumber()
  unitPrice: number;
}

export class CreateQuoteDto {
  @ApiProperty({ example: 'work-order-uuid' })
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ type: [QuoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  validUntil?: string;
}
