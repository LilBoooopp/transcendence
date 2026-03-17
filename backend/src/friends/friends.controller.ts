import { Controller, Post, Patch, Get, Body, Param, Delete, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/guards/auth.guards';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';


@Controller('friends')
@UseGuards(RateLimitGuard, AuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post()
  async sendFriendRequest(@Req() req: any, @Body() body) {
    return this.friendsService.friendRequest(req.user.userId, body.toUsername);
  }

  @Get()
  async listFriends(@Req() req: any) {
    return this.friendsService.listFriends(req.user.userId);
  }

  @Get('request')
  async listFriendsRequest(@Req() req: any) {
    return this.friendsService.listFriendsRequest(req.user.userId);
  }

  @Post('accept/:id')
  async acceptFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.acceptFriendRequest(req.user.userId, id);
  }

  @Post('reject/:id')
  async rejectFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.rejectFriendRequest(req.user.userId, id);
  }

  /*

  POST  /api/friends/:friendId/game-request
PATCH /api/friends/game-request/:requestId/accept
PATCH /api/friends/game-request/:requestId/reject

patch= modifier ressource existante. 
*/

  




}