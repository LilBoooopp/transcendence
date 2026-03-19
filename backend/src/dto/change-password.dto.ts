import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword: string;
}