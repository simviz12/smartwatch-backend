import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { PasswordHasherPort, TokenIssuerPort, User, UserRepositoryPort } from '../domain/user.entity';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  private static readonly ROUNDS = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BcryptPasswordHasher.ROUNDS);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

@Injectable()
export class JwtTokenIssuer implements TokenIssuerPort {
  constructor(private readonly jwt: JwtService) {}

  issue(user: User): Promise<string> {
    return this.jwt.signAsync({ sub: user.id, email: user.email });
  }
}
