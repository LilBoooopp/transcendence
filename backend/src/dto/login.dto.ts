import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(25)
  username: string;

  @IsString()
  @MaxLength(64)
  password: string;
}
