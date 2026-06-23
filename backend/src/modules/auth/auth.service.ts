
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserLoginDto } from './dto/UserLogin.dto';
import { CheckUserNameDto } from './dto/CheckUserName.dto';
import { PrismaService } from 'src/prisma.service';
import { SetPasswordDto } from './dto/SetPassword.dto';

@Injectable()
export class AuthService {
  constructor(private  prisma: PrismaService,
              private jwtService: JwtService
            ) {}

  async signIn(data: UserLoginDto){
    const user = await this.prisma.user.findUnique({
      where:{
        username: data.username,
      }
    });

    if (!user) {
      throw new UnauthorizedException('Wrong user name');
    }
    if (!(user.password === data.password)) {
      throw new UnauthorizedException('Password does not match');
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      message: 'User Logged in',
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
      }
    };
  }

  async checkUserName(data: CheckUserNameDto) {
    const user = await this.prisma.user.findUnique({
      where:{
        username: data.username,
      }
    });

    if(!user){
      throw new UnauthorizedException('user not found')
    }

    return {
      exists: true,
      passwordSet: user.passwordSet,
      username: user.username,
    };
  }

  async setPassword(data: SetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: data.username
      }
    });

    if(!user) {
      throw new UnauthorizedException('User not found');
    };

    if(user.passwordSet) {
      throw new ConflictException('The password is already set');
    };

    await this.prisma.user.update({
      where: {
        username: data.username,
      },
      data: {
        password: data.password,
        passwordSet: true
      },
    });

    return {
      message: 'Password set',
      passwordset: true,
    }
  }
}


