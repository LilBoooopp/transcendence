import { Controller, Post, Patch, Get, Body, Param, Delete, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guards';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @UseGuards(AuthGuard)
  @Delete()
  async deleteUser(@Req() req: any)
  {
	console.log('Delete User');
	return this.userService.deleteUser(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Patch()
  async modifyUser(@Req() req: any, @Body() body)
  {
	console.log('In patch/user/');
	return this.userService.modifyUser(req.user.userId, body.bio, body.firstName);
  }

 @UseGuards(AuthGuard)
  @Get('me')
  async getUserProfile(@Req() req: any){
	console.log('in users/me');
	return this.userService.getUserProfile(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
 @UseGuards(AuthGuard)
  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
