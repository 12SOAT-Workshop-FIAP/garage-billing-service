import { Controller, Get, Post, Body, Param, Patch, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@ApiTags('quotes')
@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo orçamento' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Orçamento criado' })
  create(@Body() createDto: CreateQuoteDto) {
    return this.quoteService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os orçamentos' })
  findAll() {
    return this.quoteService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  findOne(@Param('id') id: string) {
    return this.quoteService.findOne(id);
  }

  @Get('work-order/:workOrderId')
  @ApiOperation({ summary: 'Buscar orçamentos por OS' })
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.quoteService.findByWorkOrder(workOrderId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprovar orçamento' })
  approve(@Param('id') id: string) {
    return this.quoteService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeitar orçamento' })
  reject(@Param('id') id: string) {
    return this.quoteService.reject(id);
  }

  @Patch(':id/send')
  @ApiOperation({ summary: 'Enviar orçamento ao cliente' })
  send(@Param('id') id: string) {
    return this.quoteService.send(id);
  }
}
