import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Request,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enum/role.enum';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Post('login-user')
  loginUser() {
    return {
      access_token: this.jwtService.sign({
        sub: 1,
        email: 'user@test.com',
        roles: [Role.User],
      }),
    };
  }

  @Public()
  @Post('login-admin')
  loginAdmin() {
    return {
      access_token: this.jwtService.sign({
        sub: 2,
        email: 'admin@test.com',
        roles: [Role.Admin],
      }),
    };
  }

  @Roles(Role.User)
  @Get('user-only')
  userOnly() {
    return 'Only users can access this';
  }

  @Roles(Role.Admin)
  @Get('admin-only')
  adminOnly() {
    return 'Only admins can access this';
  }
}