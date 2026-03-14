import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profilePicture?: string;
  }) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Patch('change-password')
  changePassword(@Req() req: any, @Body() body: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}