import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserService} from 'src/user/user.service'
import { JwtService} from '@nestjs/jwt'
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { IsEmail } from 'class-validator';

type AuthInput = {username: string; password: string};
type SignInData = {userId: string; username: string}; //nerver return the password
type AuthResult = { accessToken: string; userId: string; username: string};

@Injectable()
export class AuthService {
	//here we inject the user servci
	//so we can use the user service to fetch the user by their username
	constructor(
		private usersService: UserService,
		private jwtService: JwtService,
		private prisma: PrismaService,
	) {}

	async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  })
  
  {
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
		avatarUrl: "defaultAvatar.png",
		bio: 'Basic bio',
		isOnline: true,
        statistics: {
          create: {},
        },
      },
      include: {
        statistics: true,
      },
    });
  }

	//this method will return an authentication result object
	async authenticate(input: AuthInput): Promise<AuthResult>{
		//first we validate the user
		const user = await this.validateUser(input);
		//does the user exist??
		if (!user){
			throw new UnauthorizedException();
		}
		//if user is valid
		await this.prisma.user.update({
			where: { id: user.userId},
			data: { isOnline: true}
		});
		return this.signIn(user)
	}

	async validateUser(input: AuthInput): Promise<SignInData | null>{
		const user = await this.usersService.findByUsername(input.username);

		//validate that the password is good
		//if (user && user.password === input.password) 
		if (user && await bcrypt.compare(input.password, user.password))
		{
			return {
				userId: user.id,
				username: user.username,
			}
		}
		return null;
	}

	async signIn(user: SignInData): Promise<AuthResult> {
		const tokenPayload = {
			sub: user.userId, //convention in jwt token payload
			username: user.username,
		};
		const accessToken = await this.jwtService.signAsync(tokenPayload);
		return {accessToken, username: user.username, userId: user.userId};
	}

	async logout(userId:string){
		console.log('In new logout');
		await this.prisma.user.update({
			where: { id : userId},
			data: { isOnline: false}
		});
		return true;///??
	}

	async isConnected(userId: string): Promise<{ isConnected: boolean; username: string}>
	{
		console.log('in service auth/isConnected');
		const user = await this.prisma.user.findUnique({
			where: {id: userId},
			//return only isOnline
			select: { username: true, isOnline: true},
		})
		if (!user){
			console.log('no user');
			return {isConnected: false, username: ' '};
		}
		console.log('it is an user');
		return {
			isConnected: user.isOnline,
			username: user.username,
		}
	}

}

	
