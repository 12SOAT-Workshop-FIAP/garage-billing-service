import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @ApiProperty({ example: 'quote-id' })
  @IsString()
  @IsNotEmpty()
  quoteId: string;

  @ApiProperty({ example: 'work-order-id' })
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty({ example: 'customer-id' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 350.99 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
