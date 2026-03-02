import { Controller, Request, Body, Get, HttpCode, HttpStatus, NotImplementedException, Post, UseGuards } from '@nestjs/common';

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

	@UseGuards(AuthGuard)
	@Get('game')
	getUserInfo(@Request() request) {
		return request.User;
	}
}