import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/guards/auth.guards';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
@UseGuards(RateLimitGuard, AuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a friend request to a user' })
  @ApiBody({
    schema: {
      example: { toUsername: 'john_doe' }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
    schema: {
      example: {
        id: '123',
        fromUserId: 'user1',
        toUserId: 'user2',
        status: 'PENDING'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Cannot add yourself or request already pending' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already friends or request already pending' })
  async sendFriendRequest(@Req() req: any, @Body() body: { toUsername: string }) {
    return this.friendsService.friendRequest(req.user.userId, body.toUsername);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of accepted friends' })
  @ApiResponse({
    status: 200,
    description: 'List of friends retrieved successfully',
    schema: {
      example: [
        {
          id: 'user2',
          username: 'john_doe',
          avatarUrl: 'avatar.png',
          elo: 1500,
          status: 'online',
          gameId: undefined,
          currentStreak: 5,
          bestStreak: 10,
          bio: 'Chess enthusiast'
        }
      ]
    }
  })
  async listFriends(@Req() req: any) {
    return this.friendsService.listFriends(req.user.userId);
  }

  @Get('request')
  @ApiOperation({ summary: 'Get pending friend requests sent to current user' })
  @ApiResponse({
    status: 200,
    description: 'List of pending requests retrieved successfully',
    schema: {
      example: [
        {
          id: 'request1',
          username: 'alice_chess',
          avatarUrl: 'alice.png'
        }
      ]
    }
  })
  async listFriendsRequest(@Req() req: any) {
    return this.friendsService.listFriendsRequest(req.user.userId);
  }

  @Post('accept/:id')
  @ApiOperation({ summary: 'Accept a pending friend request' })
  @ApiParam({ name: 'id', description: 'ID of the friend request to accept' })
  @ApiResponse({
    status: 200,
    description: 'Friend request accepted successfully',
    schema: {
      example: {
        id: 'user2',
        username: 'john_doe',
        avatarUrl: 'avatar.png',
        elo: 1500,
        status: 'online',
        gameId: undefined,
        currentStreak: 5,
        bestStreak: 10,
        bio: 'Chess enthusiast'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  async acceptFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.acceptFriendRequest(req.user.userId, id);
  }

  @Post('reject/:id')
  @ApiOperation({ summary: 'Reject a pending friend request' })
  @ApiParam({ name: 'id', description: 'ID of the friend request to reject' })
  @ApiResponse({
    status: 200,
    description: 'Friend request rejected successfully',
    schema: { example: { success: true } }
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  async rejectFriendRequest(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.rejectFriendRequest(req.user.userId, id);
  }
}