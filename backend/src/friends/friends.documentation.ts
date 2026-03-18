import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

export function FriendsControllerDocs() {
  return applyDecorators(
    ApiTags('friends'),
    ApiBearerAuth(),
  );
}

export function SendFriendRequestDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Send a friend request to a user' }),
    ApiBody({
      schema: {
        example: { toUsername: 'john_doe' }
      }
    }),
    ApiResponse({
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
    }),
    ApiResponse({ status: 400, description: 'Cannot add yourself or request already pending' }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiResponse({ status: 409, description: 'Already friends or request already pending' }),
  );
}

export function ListFriendsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get list of accepted friends' }),
    ApiResponse({
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
    }),
  );
}

export function ListFriendsRequestDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get pending friend requests sent to current user' }),
    ApiResponse({
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
    }),
  );
}

export function AcceptFriendRequestDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Accept a pending friend request' }),
    ApiParam({ name: 'id', description: 'ID of the friend request to accept' }),
    ApiResponse({
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
    }),
    ApiResponse({ status: 404, description: 'Friend request not found' }),
  );
}

export function RejectFriendRequestDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject a pending friend request' }),
    ApiParam({ name: 'id', description: 'ID of the friend request to reject' }),
    ApiResponse({
      status: 200,
      description: 'Friend request rejected successfully',
      schema: { example: { success: true } }
    }),
    ApiResponse({ status: 404, description: 'Friend request not found' }),
  );
}