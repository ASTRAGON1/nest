import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminLoginDto } from './dto/AdminLogin.dto';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';


@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService,
              private jwtService: JwtService,
  ) {}

  async adminLogin(data: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: {
        username: data.username,
    }
    });

    if(!admin || admin.password !== data.password) {
      throw new UnauthorizedException('invalid credentials');
    }

    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Admin Logged in',
      access_token: token,
      admin: {
        id: admin.id,
        username: admin.username,
      }
    }

  }

  async createUser(data: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username : data.username
      }
    })
    if(user) {
      throw new ConflictException('Username already exists');
    }
    const createUser = await this.prisma.user.create({
      data: {
        username: data.username,
        storeName: data.storeName
      }
    })


    return {
      message: 'User created',
      user: createUser,

    }
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        storeName: true,
        isActive: true,
        passwordSet: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            products: true,
            sales: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return users;
  }

  async updateUser(id: number, updateData: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: updateData.isActive,
      }
    });
    return user;
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.delete({ where: { id }, select: {id: true, username: true,}});
      return {
        message: 'user deleted',
        userId: user.id,
      }
    };
    
  }