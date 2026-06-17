import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users/users.controller';
import { AdminController } from './controllers/admin/admin.controller';

@Module({
  controllers: [UsersController, AdminController]
})
export class UsersModule {}
