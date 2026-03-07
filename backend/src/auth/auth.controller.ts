import { Controller, Req, Request, Body, Get, HttpCode, HttpStatus, NotImplementedException, Post, UseGuards } from '@nestjs/common';

import { AuthService} from './auth.service';
import { AuthGuard } from './guards/auth.guards';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	login(@Body() input: {username: string; password: string}) {
		return this.authService.authenticate(input);
	}

	// a revoir
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() body: {
		email: string;
		username: string;
		password: string;
		firstName?: string;
		lastName?: string;
	}){
		const user = await this.authService.createUser(body);
		//const { password, ...userWithoutPassword} = user;
		//return userWithoutPassword;
		const signInData = { userId: user.id, username: user.username };
		return this.authService.signIn(signInData);
	}

	@UseGuards(AuthGuard)
	@Get('me')
	async isConnected(@Req() req: any){
		console.log('in auth/me');
		const result = await this.authService.isConnected(req.user.userId);
		return result;
	}

	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Post('logout')
	logout(@Req() req: any) {
		console.log('Beginning of logout');
		return this.authService.logout(req.user.userId);
	}

	// a déplacer dans games...
	@UseGuards(AuthGuard)
	@Get('game')
	getUserInfo(@Request() request) {
		return request.user;
	}
}