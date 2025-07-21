import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UuidParamDto } from 'src/common/dto/uuid-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientController {
  constructor(private clientService: ClientService) {}

  @Get()
  async findAll(@GetUser() user: JwtPayload) {
    return this.clientService.findAll(user.userId);
  }

  @Post()
  async create(@GetUser() user: JwtPayload, createDto: CreateClientDto) {
    return this.clientService.create(user.userId, createDto);
  }

  @Get(':id')
  async findOne(@GetUser() user: JwtPayload, @Param() params: UuidParamDto) {
    const client = await this.clientService.findOne(user.userId, params.id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  @Patch('id')
  async update(
    @GetUser() user: JwtPayload,
    @Param() params: UuidParamDto,
    @Body() upadteDto: UpdateClientDto,
  ) {
    const client = await this.clientService.update(user.userId, params.id, upadteDto);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  @Delete('id')
  async remove(@GetUser() user: JwtPayload, @Param() params: UuidParamDto) {
    const deleted = await this.clientService.delete(user.userId, params.id);
    if (!deleted) {
      throw new NotFoundException('Client not found');
    }
    return deleted;
  }
}
