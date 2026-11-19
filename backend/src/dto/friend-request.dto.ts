import { IsString, MaxLength } from 'class-validator';

export class FriendRequestDto {
  @IsString()
  @MaxLength(25)
  toUsername: string;
}
