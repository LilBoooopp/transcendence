import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io';
import { JWT_SECRET } from '../configs/jwtsecret';
// AUTH GARD
//if it returns true, it means that the endpoint can be accessed. false we are refusing the access
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) { }
	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const authorization = request.headers.authorization; //Bearer <token> we are looking for the authorisation
		if (!authorization) {
			throw new UnauthorizedException('No authorization header');
		}
		const token = authorization?.split(' ')[1];// int the autorization, it is looking for the token. 
		if (!token) {
			throw new UnauthorizedException('No token provided'); //no token, so request rejected so 401 error status
		}
		try {
			const tokenPayload = await this.jwtService.verifyAsync(token);
			//we add a user object to the request
			request.user = {
				userId: tokenPayload.sub,
				username: tokenPayload.username
			}
			return true;
		}
		catch (error) {
			throw new UnauthorizedException('Invalid Token ge');
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
