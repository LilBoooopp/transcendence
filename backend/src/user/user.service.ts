
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UserProfile = { username: string, id: string, firstName: string | null, bio: string | null, isOnline: boolean, avatarUrl: string | null };
type UserAuth = { id: string, username: string, password: string };

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
    select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true},  
	});
}
  async modifyUser(id: string, newBio?: string, newFirstName?: string) : Promise<UserProfile | null > {
    const data: { bio?: string; firstName?: string } = {};

    if (newBio !== undefined && newBio !== null && newBio !== '') {
      data.bio = newBio;
    }

    if (newFirstName !== undefined && newFirstName !== null && newFirstName !== '') {
      data.firstName = newFirstName;
    }

    return this.prisma.user.update ({
      where: { id },
      data,
      select: { username: true, id: true, firstName: true, bio: true, isOnline: true, avatarUrl: true},
    });
	}

	async deleteUser(id: string){
		return await this.prisma.user.delete({
			where: {id}
		});
	}

	

}
