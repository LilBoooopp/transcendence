import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/guards/auth.guards';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';
import {
  FriendsControllerDocs,
  SendFriendRequestDocs,
  ListFriendsDocs,
  ListFriendsRequestDocs,
  AcceptFriendRequestDocs,
  RejectFriendRequestDocs,
} from './friends.documentation';

@FriendsControllerDocs()
@Controller('friends')
@UseGuards(RateLimitGuard, AuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post()
  @SendFriendRequestDocs()
  async sendFriendRequest(@Req() req: any, @Body() body: { toUsername: string }) {
    return this.friendsService.friendRequest(req.user.userId, body.toUsername);
  }

  @Get()
  @ListFriendsDocs()
  async listFriends(@Req() req: any) {
    return this.friendsService.listFriends(req.user.userId);
  }

  @Get('request')
  @ListFriendsRequestDocs()
  async listFriendsRequest(@Req() req: any) {
    return this.friendsService.listFriendsRequest(req.user.userId);
  }

  @Post('accept/:id')
  @AcceptFriendRequestDocs()
  async acceptFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.acceptFriendRequest(req.user.userId, id);
  }

  @Post('reject/:id')
  @RejectFriendRequestDocs()
  async rejectFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.rejectFriendRequest(req.user.userId, id);
  }
}