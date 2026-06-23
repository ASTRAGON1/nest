import { IsEmail, IsString } from 'class-validator';

export class AdminLoginDto {
    @IsString()
    'username': string;
    @IsString()
    'password': string;
}