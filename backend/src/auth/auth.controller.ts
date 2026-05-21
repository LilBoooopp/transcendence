import { Controller, Req, Request, Body, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService} from './auth.service';
import { AuthGuard } from './guards/auth.guards';
import { CreateUserDto } from '../dto/create-user.dto';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from './guards/rate-limit.guard';
import {
  AuthControllerDocs,
  LoginDocs,
  RegisterDocs,
  MeDocs,
  LogoutDocs,
  GameDocs,
} from './auth.documentation';

@UseGuards(RateLimitGuard)
@Controller('auth')
@AuthControllerDocs()
export class AuthController {
	constructor(private authService: AuthService) {}

	@Throttle({ default: { limit: 100, ttl: 60_000 } })
	@HttpCode(HttpStatus.OK)
	@Post('login')
	@LoginDocs()
	login(@Body() input: {username: string; password: string}) {
		return this.authService.authenticate(input);
	}

	@Throttle({ default: { limit: 100, ttl: 60_000 } })
	@Post('register')
	@RegisterDocs()
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() createUserDto: CreateUserDto){
		const user = await this.authService.createUser(createUserDto);
		return user;
	}

	@Throttle({ default: { limit: 120, ttl: 60_000 } })
	@UseGuards(AuthGuard)
	@Get('me')
	@MeDocs()
	async isConnected(@Req() req: any){
		console.log('in auth/me');
		const result = await this.authService.isConnected(req.user.userId);
		return result;
	}

	@Throttle({ default: { limit: 100, ttl: 60_000 } })
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	@Post('logout')
	@LogoutDocs()
	logout(@Req() req: any) {
		return this.authService.logout(req.user.userId);
	}

	@Throttle({ default: { limit: 120, ttl: 60_000 } })
	@UseGuards(AuthGuard)
	@Get('game')
	@GameDocs()
	getUserInfo(@Request() request) {
		return request.user;
	}
}