import { Module, forwardRef } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { QuoteModule } from '../quote/quote.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [forwardRef(() => QuoteModule), forwardRef(() => PaymentModule)],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
