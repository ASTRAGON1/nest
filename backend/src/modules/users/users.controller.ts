import { Body, Controller, Post } from '@nestjs/common';
import { Role } from '../common/enum/role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {


@Post()
@Roles(Role.Admin)
create(@Body() createData: string ) {
  return true;
}
}
