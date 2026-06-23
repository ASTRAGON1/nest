import {
  Body,
  Controller,
  Post,
  Get,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { UserLoginDto } from './dto/UserLogin.dto';
import { CheckUserNameDto } from './dto/CheckUserName.dto';
import { SetPasswordDto } from './dto/SetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('/login')
  UserLogin(@Body() data: UserLoginDto ){
    return this.authService.signIn(data);
  }

  @Public()
  @Post('/check-username')
  CheckUserName(@Body() data: CheckUserNameDto){
    return this.authService.checkUserName(data);
  }

  @Public()
  @Post('/set-password')
  SetPassword(@Body() data: SetPasswordDto) {
    return this.authService.setPassword(data);
  }

}