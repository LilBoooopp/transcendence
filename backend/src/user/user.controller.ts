//bien
import {
  Controller,
  Patch,
  Get,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/guards/auth.guards';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtService } from '@nestjs/jwt';

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

const UPLOADS_DIR = join(process.cwd(), 'src', 'uploads');

@Controller('users')
@UseGuards(RateLimitGuard, AuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class UserController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

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
  const updatedUser = await this.userService.modifyUser(req.user.userId, body.username, body.email, body.firstName, body.lastName, body.bio, body.avatarUrl);
  
  const response: any = { user: updatedUser };
  
  // Regénérer le token uniquement si le username a changé
  if (updatedUser.username !== req.user.username) {
    const tokenPayload = {
      sub: req.user.userId,
      username: updatedUser.username,
    };
    response.accessToken = await this.jwtService.signAsync(tokenPayload);
  }
  
  return response;
}

  @Patch('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(UPLOADS_DIR, { recursive: true });
          cb(null, UPLOADS_DIR);
        },
        filename: (req, file, cb) => {
          const extension = extname(file.originalname).toLowerCase();
          const safeExtension = extension || '.png';
          cb(null, `${req.user.userId}-${Date.now()}${safeExtension}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const isAllowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimetype);
        if (!isAllowed) {
          return cb(new BadRequestException('Only png, jpg, jpeg, webp files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )

  async uploadAvatar(@Req() req: any, @UploadedFile() file: UploadedFile){
    if (!file) {
      throw new BadRequestException('No avatar file uploaded');
    }
    return this.userService.updateAvatar(req.user.userId, file.filename);
  }

  @Get('me')
  async getUserProfile(@Req() req: any){
	//console.log('in users/me');
	return await this.userService.getUserProfile(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get('stats')
  async getUserStat(@Req() req: any){
    return await this.userService.getUserStat(req.user.userId);
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



  @UseGuards(AuthGuard)
  @Get('history')
  async getUserHistory(@Req() req: any)
  {
	const history = await this.userService.getUserHistory(req.user.userId);
	return history;
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }


}
