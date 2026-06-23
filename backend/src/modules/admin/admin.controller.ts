import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AdminLoginDto } from './dto/AdminLogin.dto';
import { AdminService } from './admin.service';
import { Public } from '../common/decorators/public.decorator';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';

@Controller()
export class AdminController {
    constructor(private readonly adminService: AdminService,) {}
    
    @Public()
    @Post('auth/loginAdmin')
    AdminLogin(@Body() data: AdminLoginDto) {
        return this.adminService.adminLogin(data);
    }

    @Post('/createUser')
    CreateUser(@Body() data: CreateUserDto) {
        return this.adminService.createUser(data);
    }

    @Get('/users')
    GetAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('/users/:id/status')
    UpdateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
        return this.adminService.updateUser(+id, data);
    }

    @Delete('/users/:id')
    DeleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(+id);
    }
}
