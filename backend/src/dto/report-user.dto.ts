import { IsString, MaxLength } from 'class-validator';

export class ReportUserDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}
