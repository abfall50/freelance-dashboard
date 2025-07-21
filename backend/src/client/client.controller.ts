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
  async findOne(@GetUser() user: JwtPayload, @Param('id') clientId: string) {
    const client = await this.clientService.findOne(user.userId, clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  @Patch('id')
  async update(
    @GetUser() user: JwtPayload,
    @Param('id') clientId: string,
    @Body() upadteDto: UpdateClientDto,
  ) {
    const client = await this.clientService.update(user.userId, clientId, upadteDto);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  @Delete('id')
  async remove(@GetUser() user: JwtPayload, @Param('id') clientId: string) {
    const deleted = await this.clientService.delete(user.userId, clientId);
    if (!deleted) {
      throw new NotFoundException('Client not found');
    }
    return deleted;
  }
}
