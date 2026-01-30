import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
	where: {
		OR: [
			{ email: createUserDto.email },
			{ username: createUserDto.username },
		],
	},
  });

  if (existingUser) {
	throw new ConflictException('Email or Username already exists');
  }

  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  const newUser = await this.prisma.user.create({
	data: {
		email: createUserDto.email,
		username: createUserDto.username,
		password: hashedPassword,
	},
  });

  const { password, ...result } = newUser;
  return result;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
