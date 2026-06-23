import { IsString } from "class-validator";

export class CheckUserNameDto {

    @IsString()
    'username': string;
}