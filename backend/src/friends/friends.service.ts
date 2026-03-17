import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FriendProfile = {
  id: string;
  username: string;
  avatarUrl?: string;
  elo: number;
  status: 'online' | 'offline' | 'in-game';
  gameId?: string;
}

type FriendProfileList = FriendProfile[];

type FriendRequest = {
    id: string;
    username: string;
    avatarUrl?: string;
};

type FriendRequestList = FriendRequest[];

@Injectable()
export class FriendsService {
    constructor(private prisma: PrismaService) {}

    async friendRequest(fromUserId: string, toUsername: string) {
        const toUser = await this.prisma.user.findUnique({
            where: { username: toUsername.toLowerCase() },
        });
        if (!toUser) throw new NotFoundException('User not found');
        if (toUser.id === fromUserId) throw new BadRequestException('Cannot add yourself');

        const existing = await this.prisma.friend.findFirst({
            where: {
                OR: [
                    { fromUserId, toUserId: toUser.id },
                    { fromUserId: toUser.id, toUserId: fromUserId },
                ],
            },
        });

        if (existing && existing.status === 'ACCEPTED') {
            throw new ConflictException('Already friends');
        }
        if (existing && existing.status === 'PENDING') {
            throw new ConflictException('Friend request already pending');
        }

        return this.prisma.friend.create({
            data: {
                fromUserId,
                toUserId: toUser.id,
                status: 'PENDING',
            },
        });
    }

    async listFriends(fromUserId: string): Promise<FriendProfileList | null> {
        const friendRelations = await this.prisma.friend.findMany({
            where: {
                OR: [
                    { fromUserId, status: 'ACCEPTED' },
                    { toUserId: fromUserId, status: 'ACCEPTED' },
                ],
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        statistics: true,
                        isOnline: true,
                    },
                },
                toUser: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        statistics: true,
                        isOnline: true,
                    },
                },
            },
        });

        const friends: FriendProfileList = friendRelations.map((relation) => {
            const friend = relation.fromUserId === fromUserId ? relation.toUser : relation.fromUser;

      return {
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        elo: friend.statistics?.blitzElo ?? 1200,
        status: friend.isOnline ? 'online' : 'offline',
        gameId: undefined,
				currentStreak: friend.statistics?.currentStreak ?? 0,
				bestStreak: friend.statistics?.bestStreak ?? 0,
      };
    });

        return friends;
    }

    async listFriendsRequest(userId: string): Promise<FriendRequestList | null> {
        const friendRequests = await this.prisma.friend.findMany({
            where: {
                toUserId: userId,
                status: 'PENDING',
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return friendRequests.map((req) => ({
            id: req.id,
            username: req.fromUser.username,
            avatarUrl: req.fromUser.avatarUrl,
        }));
    }

    async acceptFriendRequest(userId: string, friendId: string) {
        const friend = await this.prisma.friend.update({
            where: { id: friendId },
            data: {
                status: 'ACCEPTED',
                respondedAt: new Date(),
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        statistics: true,
                        isOnline: true,
                    },
                },
            },
        });

        return {
            id: friend.fromUser.id,
            username: friend.fromUser.username,
            avatarUrl: friend.fromUser.avatarUrl,
            elo: friend.fromUser.statistics?.blitzElo ?? 1200,
            status: friend.fromUser.isOnline ? 'online' : 'offline',
            gameId: undefined,
        };
    }

    async rejectFriendRequest(userId: string, friendId: string) {
        await this.prisma.friend.update({
            where: { id: friendId },
            data: {
                status: 'REJECTED',
                respondedAt: new Date(),
            },
        });

        return { success: true };
    }
}