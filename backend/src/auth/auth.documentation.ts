import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export function AuthControllerDocs() {
  return applyDecorators(
    ApiTags('auth'),
  );
}

export function LoginDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Login with username and password' }),
    ApiBody({
      schema: {
        example: {
          username: 'john_doe',
          password: 'password123',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful, returns access token',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          userId: 'user1',
          username: 'john_doe',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - Missing credentials' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Invalid username or password' }),
  );
}

export function RegisterDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user account' }),
    ApiBody({
      schema: {
        example: {
          email: 'john@example.com',
          username: 'john_doe',
          password: 'password123',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully, returns access token',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          userId: 'user1',
          username: 'john_doe',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Bad request - Missing or invalid fields' }),
    ApiResponse({ status: 409, description: 'Conflict - Email or username already taken' }),
  );
}

export function MeDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Check if user is connected' }),
    ApiResponse({
      status: 200,
      description: 'User connection status retrieved',
      schema: {
        example: {
          isConnected: true,
          username: 'john_doe',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function LogoutDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Logout current user' }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      schema: {
        example: true,
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}

export function GameDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user info for game' }),
    ApiResponse({
      status: 200,
      description: 'User game information retrieved',
      schema: {
        example: {
          userId: 'user1',
          username: 'john_doe',
          fingerprint: 'hashedfingerprint...',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - No authorization header' }),
  );
}
