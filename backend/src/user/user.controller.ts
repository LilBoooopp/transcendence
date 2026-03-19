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
import { AuthGuard } from '../auth/guards/auth.guards';
import { Throttle } from '@nestjs/throttler';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtService } from '@nestjs/jwt';
import {
  UserControllerDocs,
  GetAllUsersDocs,
  GetMeDocs,
  GetStatsDocs,
  GetEloHistoryDocs,
  GetHistoryDocs,
  GetByEmailDocs,
  GetByUsernameDocs,
  GetByIdDocs,
  PatchUserDocs,
  PatchPasswordDocs,
  PatchAvatarDocs,
  DeleteUserDocs,
} from './user.documentation';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

interface UploadedFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
}

const UPLOADS_DIR = join(process.cwd(), 'src', 'uploads');

@Controller('users')
@UserControllerDocs()
@UseGuards(RateLimitGuard, AuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class UserController {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) {}

    @Get()
	@GetAllUsersDocs()
    async getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Delete()
    @DeleteUserDocs()
    async deleteUser(@Req() req: any) {
        return this.userService.deleteUser(req.user.userId);
    }

    @Patch()
    @PatchUserDocs()
    async modifyUser(@Req() req: any, @Body() body: UpdateUserDto) {
        const updatedUser = await this.userService.modifyUser(
            req.user.userId,
            body.username,
            body.email,
            body.firstName,
            body.lastName,
            body.bio,
        );

        const response: any = { user: updatedUser };

        return response;
    }

    @Patch('password')
    @PatchPasswordDocs()
    async uploadPassword(@Req() req: any, @Body() body: ChangePasswordDto) {
        const updatedUser = await this.userService.modifyPassword(
            req.user.userId,
            body.oldPassword,
            body.newPassword,
        );

		const response: any = { user: updatedUser };

		if (updatedUser)
		{
			const updateUserFp = await this.userService.updateFingerprint(req.user.userId);

        	const tokenPayload = {
            sub: req.user.userId,
            fingerprint: updateUserFp.fingerprint,
        };
        response.accessToken = await this.jwtService.signAsync(tokenPayload);
		response.id = req.user.userId;
		}

        return response;
    }

    @Patch('avatar')
    @PatchAvatarDocs()
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
    async uploadAvatar(@Req() req: any, @UploadedFile() file: UploadedFile) {
        if (!file) {
            throw new BadRequestException('No avatar file uploaded');
        }
        return this.userService.updateAvatar(req.user.userId, file.filename);
    }

    @Get('me')
    @GetMeDocs()
    async getUserProfile(@Req() req: any) {
        return await this.userService.getUserProfile(req.user.userId);
    }

    @UseGuards(AuthGuard)
    @Get('stats')
    @GetStatsDocs()
    async getUserStat(@Req() req: any) {
        return await this.userService.getUserStat(req.user.userId);
    }

    @UseGuards(AuthGuard)
    @Get('elo-history')
    @GetEloHistoryDocs()
    async getUserElo(@Req() req: any) {
        return await this.userService.getUserElo(req.user.userId);
    }

    @Get('email/:email')
    @GetByEmailDocs()
    async getUserByEmail(@Param('email') email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Get('username/:username')
    @GetByUsernameDocs()
    async getUserByUsername(@Param('username') username: string) {
        const user = await this.userService.findByUsername(username);
        const userElo = await this.userService.getUserElo(user?.id || '');
        const userStats = await this.userService.getUserHistory(user?.id || '');
        if (!user) throw new NotFoundException('User not found');
        return {
            ...user,
            userElo,
            userStats,
        }
    }

    @UseGuards(AuthGuard)
    @Get('history')
    @GetHistoryDocs()
    async getUserHistory(@Req() req: any) {
        const history = await this.userService.getUserHistory(req.user.userId);
        return history;
    }

    @Get(':id')
    @GetByIdDocs()
    async getUserById(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
}