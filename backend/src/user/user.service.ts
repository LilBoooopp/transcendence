import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
//import { PrismaClient } from '@prisma/client';
//import * as bcrypt from 'bcrypt';
//import { IsEmail } from 'class-validator';

type UserProfile = { username: string, id: string, firstName: string | null, bio: string | null, isOnline: boolean, avatarUrl: string | null };
//type UserProfile = { username: string };
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
	async modifyUser(id: string, newBio: string, newFirstName: string){
		const data: any = {};

if (newBio !== undefined && newBio !== null && newBio !== '') {
  data.bio = newBio;
}

if (newFirstName !== undefined && newFirstName !== null && newFirstName !== '') {
  data.firstName = newFirstName;
}

return this.prisma.user.update({
  where: { id },
  data,
});
/*		return await this.prisma.user.update({
		where: {id},
		data: {
			bio: newBio,
			firstName: newFirstName,
		}
		});*/

	}
	async deleteUser(id: string){
		return await this.prisma.user.delete({
			where: {id}
		});
	}


}
