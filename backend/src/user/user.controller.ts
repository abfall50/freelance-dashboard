import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Get('me')
  async getMe(@GetUser() user: JwtPayload) {
    const foundUser = await this.userService.findUserById(user.userId);

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    return foundUser;
  }

  @Patch('me')
  async updateUser(@GetUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    const existingEmail = await this.userService.findUserByEmail(dto.email);

    if (dto.email && existingEmail && existingEmail.id !== user.userId) {
      throw new ConflictException('Email already in use');
    }

    let updateData: any = {};

    if (dto.email) updateData.email = dto.email;
    if (dto.password) {
      updateData.password = await this.authService.hashPassword(dto.password);
    }

    const updatedUser = await this.userService.updateUser(user.userId, updateData);

    return updatedUser;
  }

  @Delete('me')
  async deleteUser(@GetUser() user: JwtPayload) {
    const existingUser = await this.userService.findUserById(user.userId);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.userService.deleteUser(user.userId);

    return { message: 'User deleted' };
  }
}
