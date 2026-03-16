import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService){}

  async friendRequest(fromUserId: string, toUsername: string) {
  const toUser = await this.prisma.user.findUnique({ 
    where: { username: toUsername } 
  });
  if (!toUser) throw new NotFoundException('User not found');
  if (toUser.id === fromUserId) throw new BadRequestException('Cannot add yourself');

  // Vérifier s'il y a déjà une relation (dans les deux sens)
  const existing = await this.prisma.friend.findFirst({
    where: {
      OR: [
        { fromUserId, toUserId: toUser.id },
        { fromUserId: toUser.id, toUserId: fromUserId },
      ],
    },
  });

  if (existing && existing.status === 'ACCEPTED') {
    throw new ConflictException('Already friends');
  }
  if (existing && existing.status === 'PENDING') {
    throw new ConflictException('Friend request already pending');
  }

  // Créer la requête
  return this.prisma.friend.create({
    data: {
      fromUserId,
      toUserId: toUser.id,
      status: 'PENDING',
    },
  });
}
}

  // ...other methods...


