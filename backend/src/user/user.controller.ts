import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
	//ici recoit les infos de user.html
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const user = await this.userService.createUser(body);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
