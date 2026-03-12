import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(25)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(25)
  password: string;
}