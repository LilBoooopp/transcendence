import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from './configs/jwtsecret';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [AuthService],
  controllers: [AuthController],

  imports: [UserModule, PrismaModule, JwtModule.register({global: true, secret: JWT_SECRET, signOptions:{ expiresIn: '1d'},})],
})
export class AuthModule {}