import {
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export class SignUpDto {

    @IsNotEmpty()
    fullName: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;
}