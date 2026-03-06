import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
//import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { IsEmail } from 'class-validator';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    if (!data.email || !data.username || !data.password) {
      throw new BadRequestException('Email, username et password sont requis');
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
      throw new ConflictException('Email ou username déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

	//const unvalidMail = 

    return this.prisma.user.create({
      data: {
        email: data.email,
	//	userId: ,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        statistics: {
          create: {},
        },
      },
      include: {
        statistics: true,
      },
    });
  }

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

  async isConnected(userId: string): Promise<{ isConnected: boolean; username: string}>
  {
	console.log('in is connected');
	const user = await this.prisma.user.findUnique({
		where: { id: userId },
		//retourne uniquement isOnline
		select: { username:true, isOnline: true },
	})
	if (!user){
		console.log('no user');
		return { isConnected: false, username: ' ' };
	}
	console.log('it is a user');
	return {
		isConnected: user.isOnline,
		username: user.username,
	};
  }
	async getAllUsers() {
		return this.prisma.user.findMany({
      include: { statistics: true },
    });
  }
}
