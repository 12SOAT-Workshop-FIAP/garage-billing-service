import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceCatalogService } from './service-catalog.service';
import { CreateServiceCatalogDto } from './dto/create-service-catalog.dto';

@ApiTags('services')
@Controller('services')
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(@Body() createDto: CreateServiceCatalogDto) {
    return this.serviceCatalogService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all services' })
  findAll() {
    return this.serviceCatalogService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.serviceCatalogService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service' })
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateServiceCatalogDto>) {
    return this.serviceCatalogService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string) {
    return this.serviceCatalogService.remove(id);
  }
}
