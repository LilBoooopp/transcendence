import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io';
import { JWT_SECRET } from '../configs/jwtsecret';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) { }
	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const authorization = request.headers.authorization;
		if (!authorization) {
			throw new UnauthorizedException('No authorization header');
		}
		const token = authorization?.split(' ')[1];
		if (!token) {
			throw new UnauthorizedException('No token provided');
		}
		try {
			const tokenPayload = await this.jwtService.verifyAsync(token);
			request.user = {
				userId: tokenPayload.sub,
				username: tokenPayload.username
			}
			return true;
		}
		catch (error) {
			throw new UnauthorizedException('Invalid Token');
		}
	}
}

//to access the game
@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client: Socket = context.switchToWs().getClient();
		const token = client.handshake.auth?.token;

		if (!token) {
			throw new UnauthorizedException('No authentication token');
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET });
			client.data.userId = payload.sub;
			client.data.uername = payload.username;
			return (true);
		} catch {
			throw new UnauthorizedException('Invalid token');
		}
	}
}
