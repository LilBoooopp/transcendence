import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { JWT_SECRET } from 'src/auth/configs/jwtsecret';

/**
 * NotificationModule
 *
 * marked @Global so any module can inject NotificationService without explicit import
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
    }),
  ],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule { }
