import { IsString } from "class-validator";

export class SetPasswordDto {

    @IsString()
    'username': string;

    @IsString()
    'password': string;

}