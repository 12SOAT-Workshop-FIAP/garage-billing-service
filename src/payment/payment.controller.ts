import { Controller, Get, Post, Body, Param, Patch, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo pagamento' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Pagamento criado' })
  create(@Body() createDto: CreatePaymentDto) {
    return this.paymentService.create(createDto);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Processar pagamento via Mercado Pago' })
  processPayment(@Param('id') id: string) {
    return this.paymentService.processPayment(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pagamentos' })
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Get('work-order/:workOrderId')
  @ApiOperation({ summary: 'Buscar pagamentos por OS' })
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.paymentService.findByWorkOrder(workOrderId);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verificar status do pagamento no Mercado Pago' })
  verifyPayment(@Param('id') id: string) {
    return this.paymentService.verifyPayment(id);
  }
}
