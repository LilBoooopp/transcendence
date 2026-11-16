import { IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength } from 'class-validator';

export class BanUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(87600) // 10 years
  durationHours?: number;
}
