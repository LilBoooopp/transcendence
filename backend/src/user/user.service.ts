import {
    Injectable,
    ConflictException,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';

type UserProfile = {
    username: string;
    id: string;
    firstName: string | null;
    lastName?: string | null;
    bio: string | null;
    avatarUrl: string | null;
    email?: string | null;
};

type UserAuth = { id: string; username: string; password: string, fingerprint: string};
type newFingerPrint = { id: string; fingerprint: string };
type UserHistoryItem = {
    id: string;
    date: string;
    opponent: string;
    result: 'Win' | 'Loss' | 'Draw';
    moves: number;
    mode: 'Bullet' | 'Blitz' | 'Rapid';
    side: 'White' | 'Black';
};

type UserHistory = UserHistoryItem[];

type UserStat = {
  username: string;
  avatarUrl?: string | null;
  memberSince: string;
  totalGames: number;
  avgScore: number;
  bulletRating?: number;
  blitzRating?: number;
  rapidRating?: number;
	currentStreak?: number;
	bestStreak?: number;
};

const DEFAULT_AVATAR_FILENAME = '';
const UPLOADS_DIR = join(process.cwd(), 'src', 'uploads');

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findByEmail(email: string): Promise<UserProfile | null> {
        return this.prisma.user.findUnique({
            where: { email },
            select: {
                username: true,
                id: true,
                firstName: true,
                bio: true,
                isOnline: true,
                avatarUrl: true,
            },
        });
    }

    async findById(id: string): Promise<UserProfile | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                username: true,
                id: true,
                firstName: true,
                bio: true,
                isOnline: true,
                avatarUrl: true,
            },
        });
    }

    async findByUsername(username: string): Promise<UserProfile | null> {
        return this.prisma.user.findUnique({
            where: { username },
            select: {
                username: true,
                id: true,
                firstName: true,
                bio: true,
                isOnline: true,
                avatarUrl: true,
            },
        });
    }

    // Only for authentification (return password)
    async findAuthUser(username: string): Promise<UserAuth | null> {
        return this.prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true, password: true, fingerprint: true, },
        });
    }

    async getAllUsers(): Promise<UserProfile[]> {
        return this.prisma.user.findMany({
            select: {
                username: true,
                id: true,
                firstName: true,
                bio: true,
                isOnline: true,
                avatarUrl: true,
                statistics: {
                    select: {
                        bulletElo: true,
                        blitzElo: true,
                        rapidElo: true,
                    },
                },
            },
        });
    }

    async getUserProfile(id: string): Promise<UserProfile> {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                username: true,
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                bio: true,
                avatarUrl: true,
            },
        });
    }

    async modifyUser(
        id: string,
        newUsername?: string,
        newEmail?: string,
        newFirstName?: string,
        newLastName?: string,
        newBio?: string,
        newAvatar?: string,
    ): Promise<UserProfile | null> {
        const data: {
            username?: string;
            email?: string;
            firstName?: string;
            lastName?: string;
            bio?: string;
            avatarUrl?: string;
        } = {};

        if (newUsername !== undefined && newUsername !== null && newUsername !== '') {
            data.username = newUsername;
        }
        if (newEmail !== undefined && newEmail !== null && newEmail !== '') {
            data.email = newEmail;
        }
        if (newFirstName !== undefined && newFirstName !== null && newFirstName !== '') {
            data.firstName = newFirstName;
        }
        if (newLastName !== undefined && newLastName !== null && newLastName !== '') {
            data.lastName = newLastName;
        }
        if (newBio !== undefined && newBio !== null && newBio !== '') {
            data.bio = newBio;
        }
        if (newAvatar !== undefined && newAvatar !== null && newAvatar !== '') {
            data.avatarUrl = newAvatar;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('No fields to update');
        }

        try {
            return await this.prisma.user.update({
                where: { id },
                data,
                select: {
                    username: true,
                    id: true,
                    firstName: true,
                    bio: true,
                    isOnline: true,
                    avatarUrl: true,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
                if (target.includes('username')) {
                    throw new ConflictException('Username already taken');
                }
                if (target.includes('email')) {
                    throw new ConflictException('Email already taken');
                }
                throw new ConflictException('Unique field already taken');
            }
            throw error;
        }
    }

    async updateFingerprint(id: string): Promise<newFingerPrint> {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const randomFingerprint = Math.random().toString(36).substring(2, 15) + 
                                Math.random().toString(36).substring(2, 15);
      const hashedFingerprint = await bcrypt.hash(randomFingerprint, 10);

      const updated = await this.prisma.user.update({
        where: { id },
        data: { fingerprint: hashedFingerprint },
        select: { id: true, fingerprint: true },
      });

      return {
        id: updated.id,
        fingerprint: updated.fingerprint,
      };
    }

    async modifyPassword(id: string, oldPassword: string, newPassword: string) : Promise<UserProfile | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, password: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const ok = await bcrypt.compare(oldPassword, user.password);
        if (!ok) {
            throw new UnauthorizedException('Invalid password');
        }

        const hashed = await bcrypt.hash(newPassword, 10);

/*        await this.prisma.user.update({
            where: { id },
            data: { password: hashed },
        });*/

        return await this.prisma.user.update({
        where: { id },
        data: { password: hashed },
        select: {
            username: true,
            id: true,
            firstName: true,
            bio: true,
            isOnline: true,
            avatarUrl: true,
        },
    });
    }

    async getUserStat(id: string): Promise<UserStat> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                username: true,
                avatarUrl: true,
                createdAt: true,
                statistics: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Format memberSince (e.g., "Oct 2023")
        const memberSince = user.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
        });

        // Calculate average Elo from all modes
        const avgScore = user.statistics
            ? Math.round((user.statistics.bulletElo + user.statistics.blitzElo + user.statistics.rapidElo) / 3)
            : 1200;

        return {
            username: user.username,
            avatarUrl: user.avatarUrl,
            memberSince,
            totalGames: user.statistics?.totalGames ?? 0,
            avgScore,
            bulletRating: user.statistics?.bulletElo,
            blitzRating: user.statistics?.blitzElo,
            rapidRating: user.statistics?.rapidElo,
        };
    }

    async getUserElo(id: string): Promise<{
        bullet: { date: string; rating: number }[];
        blitz: { date: string; rating: number }[];
        rapid: { date: string; rating: number }[];
    }> {
        // Fetch the Elo history from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const eloHistory = await this.prisma.eloHistory.findMany({
            where: {
                userId: id,
                createdAt: { gte: thirtyDaysAgo },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Generate the last 30 days (from oldest to newest)
        const days: Date[] = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            days.push(date);
        }

        // Group Elo history by day and game type
        const eloByDayAndType: Map<string, Map<string, number>> = new Map();

        for (const elo of eloHistory) {
            const dayKey = elo.createdAt.toISOString().split('T')[0];
            const gameType = elo.gameType;

            if (!eloByDayAndType.has(dayKey)) {
                eloByDayAndType.set(dayKey, new Map());
            }

            eloByDayAndType.get(dayKey)!.set(gameType, elo.eloAfter);
        }

        // Build the arrays for each mode, with fallback to the previous day
        const buildChartData = (gameType: string) => {
            const result: { date: string; rating: number }[] = [];
            let lastRating = 1200;

            for (const day of days) {
                const dayKey = day.toISOString().split('T')[0];
                const rating = eloByDayAndType.get(dayKey)?.get(gameType) ?? lastRating;
                lastRating = rating;

                const dateStr = day
                    .toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                    })
                    .replace(/0(\d)/, '$1');

                result.push({ date: dateStr, rating });
            }

            return result;
        };

        return {
            bullet: buildChartData('BULLET'),
            blitz: buildChartData('BLITZ'),
            rapid: buildChartData('RAPID'),
        };
    }

    private async deleteAvatarIfCustom(avatarUrl?: string | null): Promise<void> {
        if (!avatarUrl || avatarUrl === DEFAULT_AVATAR_FILENAME) {
            return;
        }

        const avatarPath = join(UPLOADS_DIR, avatarUrl);
        try {
            await fs.unlink(avatarPath);
        } catch (error: any) {
            if (error?.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async updateAvatar(id: string, filename: string): Promise<UserProfile | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { avatarUrl: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        try {
            const updated = await this.prisma.user.update({
                where: { id },
                data: { avatarUrl: filename },
                select: {
                    username: true,
                    id: true,
                    firstName: true,
                    bio: true,
                    isOnline: true,
                    avatarUrl: true,
                },
            });

            if (user.avatarUrl && user.avatarUrl !== filename) {
                await this.deleteAvatarIfCustom(user.avatarUrl);
            }

            return updated;
        } catch (error) {
            await this.deleteAvatarIfCustom(filename);
            throw error;
        }
    }

    async deleteUser(id: string) {
        return await this.prisma.user.delete({
            where: { id },
        });
    }

    async getUserHistory(id: string): Promise<UserHistory> {
        // Get 10 latest completed games where user is white or black
        const games = await this.prisma.game.findMany({
            where: {
                status: 'COMPLETED',
                isAiGame: false,
                OR: [
                    { whitePlayerId: id },
                    { blackPlayerId: id },
                ],
            },
            orderBy: {
                endedAt: 'desc',
            },
            take: 10,
            include: {
                whitePlayer: { select: { id: true, username: true } },
                blackPlayer: { select: { id: true, username: true } },
            },
        });

        const history: UserHistory = games.map((game) => {
            const isWhite = game.whitePlayerId === id;
            const isBlack = game.blackPlayerId === id;

            const opponent =
                isWhite
                    ? game.blackPlayer?.username
                    : isBlack
                        ? game.whitePlayer?.username
                        : 'Unknown';

            const refDate = game.endedAt || game.createdAt;
            const dateStr = refDate.toISOString().slice(0, 10);

            let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
            if (game.winner === 'white') {
                if (isWhite) result = 'Win';
                else if (isBlack) result = 'Loss';
            } else if (game.winner === 'black') {
                if (isBlack) result = 'Win';
                else if (isWhite) result = 'Loss';
            } else {
                result = 'Draw';
            }

            const moves = game.totalMoves;

            const mode: 'Bullet' | 'Blitz' | 'Rapid' = (() => {
                const tc = game.timeControl;
                if (!tc) return 'Rapid';

                const match = tc.match(/^(\d+)(?:\+(\d+))?$/);
                if (!match) return 'Rapid';

                const minutes =
                    (parseInt(match[1], 10) + 40 * parseInt(match[2] ?? '0', 10)) / 60;

                if (minutes < 3) return 'Bullet';
                if (minutes < 10) return 'Blitz';
                return 'Rapid';
            })();

            const side: 'White' | 'Black' = isWhite ? 'White' : 'Black';

            const item: UserHistoryItem = {
                id: game.id,
                date: dateStr,
                opponent: opponent ?? 'Unknowns',
                result,
                moves,
                mode,
                side,
            };

            return item;
        });

        return history;
    }
}