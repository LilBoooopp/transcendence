import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';

//AppModule is the Nestjs root module. 
//that function is a decorator on an empty class??
//we can create some modules with cli 'nest generate module modulename' and it will
// be automatically added here
//if we remove the moduls here, it is no longer part of the application. 
@Module({
  // import all the modules needed. 
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    NotificationModule,
    GameModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule { }
