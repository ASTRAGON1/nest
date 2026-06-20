import {
  IsNotEmpty,
} from 'class-validator';

export class registerUserDto {

    @IsNotEmpty()
    fullName: string;

}