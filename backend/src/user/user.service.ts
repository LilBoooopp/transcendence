// pas trop mal

import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type UserProfile = {
  username: string;
  id: string;
  firstName: string | null;
  lastName?: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email?: string | null;
};
type UserAuth = { id: string, username: string, password: string };
type UserHistoryItem = {
  id: string;
  date: string;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  moves: number;
  mode: 'Bullet' | 'Blitz' | 'Rapid';
  accuracy: number;
};
type UserHistory = UserHistoryItem[];

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise <UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true},
    });
  }

  async findById(id: string): Promise <UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true},
    });
  }

  async findByUsername(username: string): Promise <UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true},
    });
  }

  //// Only for authentification
  async findAuthUser(username: string): Promise<UserAuth | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, password: true},
    }); 
  }

	async getAllUsers(): Promise<UserProfile[]> {
		return this.prisma.user.findMany({
      select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true}
    });
  }

  async getUserProfile(id: string): Promise<UserProfile> {
	return this.prisma.user.findUnique({
		where: { id },
    select: { username: true, id: true, email: true, firstName: true, lastName: true, bio: true, avatarUrl: true},  
	});
}
  async modifyUser(id: string, newUsername?:string, newEmail?:string, newFirstName?: string, newLastName?: string, newBio?: string, newAvatar?: string ) : Promise<UserProfile | null > {
    const data: { username?:string, email?:string, firstName?: string, lastName?: string, bio?: string, Avatar?:string } = {};

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
      data.bio = newBio;
    }
	
	    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }
    
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
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

	async deleteUser(id: string){
		return await this.prisma.user.delete({
			where: {id}
		});
	}

		async getUserHistory(id: string): Promise<UserHistory >
	{
	// Get 10 latest completed games where user is white or black
	  const games = await this.prisma.game.findMany({
    where: {
      status: 'COMPLETED',
      OR: [
        { whitePlayerId: id },
        { blackPlayerId: id },
      ],
    },
    orderBy: {
      endedAt: 'desc',   // most recent first; fallback is createdAt if needed
    },
    take: 10,
    include: {
      whitePlayer: { select: { id: true, username: true } },
      blackPlayer: { select: { id: true, username: true } },
    },
  });
  //ca va creer un tableau qu on map
  //The Array.map() is an inbuilt TypeScript function that creates
  //  a new array with the results of calling a provided function on every element in the array.
  //array.map(callback[, thisObject])
   // 2. Transformer chaque Game en UserHistoryItem
  const history: UserHistory = games.map((game) => {
	//trouver si le joueur est le black ou le noir
	const isWhite = game.whitePlayerId === id;
	const isBlack = game.blackPlayerId === id;

	//va aller chercher dans la table l autre joueur
	 const opponent =
    isWhite ? game.blackPlayer?.username :
    isBlack ? game.whitePlayer?.username :
    'Unknown';

	// choisir une date (endedAt si possible, sinon startedAt, sinon createdAt)
    const refDate = game.endedAt;
    const dateStr = refDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

	// pas sure que ca fonctionne. 
	let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
	if (game.winner === 'white') {
      if (isWhite) result = 'Win';
      else if (isBlack) result = 'Loss';
    } else if (game.winner === 'black') {
      if (isBlack) result = 'Win';
      else if (isWhite) result = 'Loss';
    } else {
      // a mettre plus de possibilites?
      result = 'Draw';
    }
	let moves = 0; // a refaire voir fonction a la fin du jeux. 
	// a revoirs
	const mode: 'Bullet' | 'Blitz' | 'Rapid' = (() => {
      const tc = game.timeControl;
      if (!tc) return 'Rapid';
      const [base] = tc.split('+');
      const minutes = Number(base);
      if (!Number.isFinite(minutes)) return 'Rapid';
      if (minutes <= 3) return 'Bullet';
      if (minutes <= 10) return 'Blitz';
      return 'Rapid';
    })();;

	const accuracy = 0;// a retirer. 
	const item: UserHistoryItem = {
      id: game.id,
      date: dateStr,
      opponent: opponent ?? 'Unknowns',
      result,
      moves,
      mode,
      accuracy,
    };
    return item;
  });
  return history;
}

}
