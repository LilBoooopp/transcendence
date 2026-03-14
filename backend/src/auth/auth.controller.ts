import { Controller, Req, Request, Body, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService} from './auth.service';
import { AuthGuard } from './guards/auth.guards';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	login(@Body() input: {username: string; password: string}) {
		return this.authService.authenticate(input);
	}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() createUserDto: CreateUserDto){
		const user = await this.authService.createUser(createUserDto);
		return user;
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

	@UseGuards(AuthGuard)
	@Get('game')
	getUserInfo(@Request() request) {
		return request.user;
	}
}