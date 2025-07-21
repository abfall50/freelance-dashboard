import { MissionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateMissionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(MissionStatus)
  status: MissionStatus;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsUUID()
  clientId: string;
}
