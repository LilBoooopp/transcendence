import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';

export function UserControllerDocs() {
  return applyDecorators(
    ApiTags('users'),
    ApiBearerAuth(),
  );
}

export function GetAllUsersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all users' }),
    ApiResponse({
      status: 200,
      description: 'List of all users retrieved successfully',
      schema: {
        example: [
          {
            username: 'john_doe',
            id: 'user1',
            firstName: 'John',
            bio: 'Chess player',
            isOnline: true,
            avatarUrl: 'avatar.png',
            statistics: {
              bulletElo: 1600,
              blitzElo: 1500,
              rapidElo: 1400,
            },
          },
        ],
      },
    }),
  );
}

export function GetMeDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user profile' }),
    ApiResponse({
      status: 200,
      description: 'Current user profile retrieved successfully',
      schema: {
        example: {
          username: 'john_doe',
          id: 'user1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Chess enthusiast',
          avatarUrl: 'avatar.png',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function GetStatsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user statistics' }),
    ApiResponse({
      status: 200,
      description: 'User statistics retrieved successfully',
      schema: {
        example: {
          username: 'john_doe',
          avatarUrl: 'avatar.png',
          memberSince: 'Oct 2023',
          totalGames: 150,
          avgScore: 1500,
          bulletRating: 1600,
          blitzRating: 1500,
          rapidRating: 1400,
          currentStreak: 5,
          bestStreak: 12,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function GetEloHistoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Elo rating history for last 30 days' }),
    ApiResponse({
      status: 200,
      description: 'Elo history retrieved successfully',
      schema: {
        example: {
          bullet: [
            { date: '2026-03-01', rating: 1500 },
            { date: '2026-03-02', rating: 1520 },
          ],
          blitz: [
            { date: '2026-03-01', rating: 1450 },
            { date: '2026-03-02', rating: 1470 },
          ],
          rapid: [
            { date: '2026-03-01', rating: 1400 },
            { date: '2026-03-02', rating: 1420 },
          ],
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function GetHistoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get game history for current user' }),
    ApiResponse({
      status: 200,
      description: 'Game history retrieved successfully',
      schema: {
        example: [
          {
            id: 'game1',
            date: '2026-03-18',
            opponent: 'alice_chess',
            result: 'Win',
            moves: 42,
            mode: 'Blitz',
            side: 'White',
          },
          {
            id: 'game2',
            date: '2026-03-17',
            opponent: 'bob_player',
            result: 'Loss',
            moves: 35,
            mode: 'Rapid',
            side: 'Black',
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function GetByEmailDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by email' }),
    ApiParam({ name: 'email', description: 'Email address of the user' }),
    ApiResponse({
      status: 200,
      description: 'User retrieved successfully',
      schema: {
        example: {
          username: 'john_doe',
          id: 'user1',
          firstName: 'John',
          bio: 'Chess player',
          isOnline: true,
          avatarUrl: 'avatar.png',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function GetByUsernameDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by username' }),
    ApiParam({ name: 'username', description: 'Username of the user' }),
    ApiResponse({
      status: 200,
      description: 'User retrieved successfully',
      schema: {
        example: {
          username: 'john_doe',
          id: 'user1',
          firstName: 'John',
          bio: 'Chess player',
          isOnline: true,
          avatarUrl: 'avatar.png',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function GetByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by ID' }),
    ApiParam({ name: 'id', description: 'ID of the user' }),
    ApiResponse({
      status: 200,
      description: 'User retrieved successfully',
      schema: {
        example: {
          username: 'john_doe',
          id: 'user1',
          firstName: 'John',
          bio: 'Chess player',
          isOnline: true,
          avatarUrl: 'avatar.png',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function PatchUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user profile information' }),
    ApiBody({
      schema: {
        example: {
          username: 'john_doe_new',
          email: 'john.new@example.com',
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Updated bio',
          avatarUrl: 'avatar.png',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'User profile updated successfully',
      schema: {
        example: {
          user: {
            username: 'john_doe_new',
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            bio: 'Updated bio',
            avatarUrl: 'avatar.png',
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input' }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
    ApiResponse({ status: 409, description: 'Conflict - Username or email already exists' }),
  );
}

export function PatchPasswordDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Change user password' }),
    ApiBody({
      schema: {
        example: {
          oldPassword: 'currentPassword123',
          newPassword: 'newPassword123',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Password changed successfully, new token provided',
      schema: {
        example: {
          user: {
            username: 'john_doe',
            id: 'user1',
            firstName: 'John',
            bio: 'Chess player',
            isOnline: true,
            avatarUrl: 'avatar.png',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          id: 'user1',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid password' }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header or wrong password' }),
  );
}

export function PatchAvatarDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Upload user avatar' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description: 'Avatar image file (png, jpg, jpeg, webp, max 5MB)',
          },
        },
        required: ['avatar'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Avatar uploaded successfully',
      schema: {
        example: {
          username: 'john_doe',
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Chess player',
          avatarUrl: 'user1-1710775200000.png',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid file format or no file uploaded' }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function DeleteUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete user account' }),
    ApiResponse({
      status: 200,
      description: 'User account deleted successfully',
      schema: {
        example: {
          id: 'user1',
          username: 'john_doe',
          email: 'john@example.com',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}
