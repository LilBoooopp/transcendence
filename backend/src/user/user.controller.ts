//bien
import { Controller, Post, Patch, Get, Body, Param, Delete, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guards';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';

@Controller('users')
@UseGuards(RateLimitGuard, AuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Delete()
  async deleteUser(@Req() req: any)
  {
	//console.log('Delete User');
	return this.userService.deleteUser(req.user.userId);
  }

  @Patch()
  async modifyUser(@Req() req: any, @Body() body)
  {
	console.log('In patch/user/');
	return this.userService.modifyUser(req.user.userId, body.bio, body.firstName);
  }

  @Get('me')
  async getUserProfile(@Req() req: any){
	return this.userService.getUserProfile(req.user.userId);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
