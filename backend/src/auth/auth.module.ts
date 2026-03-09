import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
//jwt librairy to make the token
import { JwtModule } from '@nestjs/jwt';
///!!! reinstaller jwt dans le docker??
import { JWT_SECRET } from './configs/jwtsecret';
import { PrismaService } from '../prisma/prisma.service';


@Module({
  providers: [AuthService],
  controllers: [AuthController],

  //change the time of expiration?? '30m'??
  imports: [UserModule, PrismaModule, JwtModule.register({global: true, secret: JWT_SECRET, signOptions:{ expiresIn: '1d'},})],
})
export class AuthModule {}