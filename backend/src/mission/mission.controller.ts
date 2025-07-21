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
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionService } from './mission.service';

@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionController {
  constructor(private missionService: MissionService) {}

  @Get()
  async findAll(@GetUser() user: JwtPayload) {
    return this.missionService.findAll(user.userId);
  }

  @Post()
  async create(@GetUser() user: JwtPayload, @Body() createDto: CreateMissionDto) {
    return this.missionService.create(user.userId, createDto);
  }

  @Get(':id')
  async findOne(@GetUser() user: JwtPayload, @Param('id') missionId: string) {
    const mission = await this.missionService.findOne(user.userId, missionId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return mission;
  }

  @Patch(':id')
  async update(
    @GetUser() user: JwtPayload,
    @Param('id') missionId: string,
    @Body() updateDto: UpdateMissionDto,
  ) {
    const mission = await this.missionService.update(user.userId, missionId, updateDto);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return mission;
  }

  @Delete(':id')
  async remove(@GetUser() user: JwtPayload, @Param('id') missionId: string) {
    const mission = await this.missionService.delete(user.userId, missionId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return mission;
  }
}
