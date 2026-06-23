import { IsOptional, IsString } from "class-validator"

export class CreateUserDto {
    @IsString()
    'username': string;

    @IsOptional()
    @IsString()
    'storeName': string;
}