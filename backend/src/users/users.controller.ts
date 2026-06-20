import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enum/role.enum';

@Controller('users')
export class UsersController {


@Post()
@Roles(Role.Admin)
create(@Body() createData: string ) {
  return true;
}
}
