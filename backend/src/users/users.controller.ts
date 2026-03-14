import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() body: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profilePicture?: string;
  }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('change-password')
  changePassword(@Req() req: any, @Body() body: { newPassword: string }) {
    return this.usersService.changePassword(req.user.id, body.newPassword);
  }
}