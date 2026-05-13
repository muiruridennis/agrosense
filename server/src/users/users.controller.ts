import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { UpdateUserDto } from './dto/update-user.dto';

// @UseGuards(JwtAuthenticationGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.getAll();
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }

  @Patch('me')
  updateCurrentUser(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // TODO: Implement update logic in users.service
    return { message: 'User update not yet implemented', userId: user.id };
  }
}
