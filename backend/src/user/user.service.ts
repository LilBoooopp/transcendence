import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
//import { PrismaClient } from '@prisma/client';
//import * as bcrypt from 'bcrypt';
//import { IsEmail } from 'class-validator';

type UserProfile = { username: string, id: string, firstName: string | null, bio: string | null, isOnline: boolean, avatarUrl: string | null };
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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { statistics: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { statistics: true },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
	  //inclu les statistics dans le retour
      include: { statistics: true },
    });
  }

	async getAllUsers() {
		return this.prisma.user.findMany({
      include: { statistics: true },
    });
  }

  async getUserProfile(id: string): Promise<UserProfile | null > {
	return this.prisma.user.findUnique({
		where: { id },
		//select: { username: true},
    select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true},  
	});
}


	async modifyUser(id: string, newBio: string, newFirstName: string)
	{
		const data: any = {};

if (newBio !== undefined && newBio !== null && newBio !== '')
	{ data.bio = newBio;}

if (newFirstName !== undefined && newFirstName !== null && newFirstName !== '') {
  data.firstName = newFirstName;
}
return this.prisma.user.update({
  where: { id },
  data,
});
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

