import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PartService } from './part.service';
import { CreatePartDto } from './dto/create-part.dto';

@ApiTags('parts')
@Controller('parts')
export class PartController {
  constructor(private readonly partService: PartService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new part' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(@Body() createDto: CreatePartDto) {
    return this.partService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all parts' })
  findAll() {
    return this.partService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'List low stock parts' })
  findLowStock() {
    return this.partService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get part by ID' })
  findOne(@Param('id') id: string) {
    return this.partService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update part' })
  update(@Param('id') id: string, @Body() updateDto: Partial<CreatePartDto>) {
    return this.partService.update(id, updateDto);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: 'Update stock quantity' })
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.partService.updateStock(id, quantity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete part' })
  remove(@Param('id') id: string) {
    return this.partService.remove(id);
  }
}
