import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MercadoPagoService } from './mercado-pago.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    forwardRef(() => MessagingModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, MercadoPagoService],
  exports: [PaymentService],
})
export class PaymentModule {}
