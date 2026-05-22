import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserService } from 'src/user/user.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { isUsernameAllowed } from '../common/username-filter';

type AuthInput = { username: string; password: string };
type SignInData = { userId: string; username: string; fingerprint: string };
type AuthResult = { accessToken: string; userId: string; username: string };

@Injectable()
export class AuthService {
  
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  async createUser(data: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResult> {
    if (!data.email || !data.username || !data.password) {
      throw new BadRequestException('Email, username, and password are mandatory');
    }

    if (!isUsernameAllowed(data.username)) {
      throw new BadRequestException('Username contains prohibited content');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });
    if (existingUser) {
      throw new ConflictException('Email or username is already taken');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

	const randomFingerprint = Math.random().toString(36).substring(2, 15) + 
                                Math.random().toString(36).substring(2, 15);
    const hashedFingerprint = await bcrypt.hash(randomFingerprint, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
		fingerprint: hashedFingerprint,
        avatarUrl: "",
        bio: 'I will be happy to play',
        isOnline: true,
        statistics: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
		fingerprint: true,
      },
    });

    return this.signIn({ userId: createdUser.id, username: createdUser.username, fingerprint: createdUser.fingerprint });
  }

  async authenticate(input: AuthInput): Promise<AuthResult> {

    const user = await this.validateUser(input);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return this.signIn(user)
  }

  async validateUser(input: AuthInput): Promise<SignInData | null> {

    const user = await this.usersService.findAuthUser(input.username);

    if (!user) return null;

    if (user.isBanned) {
      if (user.bannedUntil && user.bannedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null },
        });
      } else {
        throw new UnauthorizedException('Your account has been banned');
      }
    }

    const valid = await bcrypt.compare(input.password, user.password);

    if (!valid) return null;

    return {
      userId: user.id,
      username: user.username,
	  fingerprint: user.fingerprint,
    };
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      sub: user.userId,
      username: user.fingerprint,
    };
    const accessToken = await this.jwtService.signAsync(tokenPayload);
    return { accessToken, username: user.username, userId: user.userId };
  }

  async logout(userId: string) {
    return true;
  }

  async isConnected(userId: string): Promise<{ isConnected: boolean; username: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, isOnline: true },
    })
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      isConnected: user.isOnline,
      username: user.username,
    }
  }

}


