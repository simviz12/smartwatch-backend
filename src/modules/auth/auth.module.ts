import { Inject, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../../shared/config/config.service';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { GetProfileUseCase, LoginUseCase, RegisterUseCase } from './application/auth.use-cases';
import {
  normalizeEmail,
  PASSWORD_HASHER,
  PasswordHasherPort,
  TOKEN_ISSUER,
  USER_REPOSITORY,
  UserRepositoryPort,
} from './domain/user.entity';
import { BcryptPasswordHasher, JwtTokenIssuer, PrismaUserRepository } from './infrastructure/auth.adapters';
import { AuthController, JwtAuthGuard } from './presentation/auth.controller';

/**
 * Creates the demo account (DEMO_EMAIL / DEMO_PASSWORD) at startup if it does not exist,
 * so a reviewer can sign in right after deployment without registering.
 */
@Injectable()
export class DemoAccountSeeder implements OnModuleInit {
  private readonly logger = new Logger('DemoAccountSeeder');

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async onModuleInit() {
    const email = config.DEMO_EMAIL ? normalizeEmail(config.DEMO_EMAIL) : '';
    const password = config.DEMO_PASSWORD ?? '';
    if (!email || !password) return;
    try {
      if (await this.users.findByEmail(email)) return;
      await this.users.create({ email, name: config.DEMO_NAME || 'Cuenta demo', passwordHash: await this.hasher.hash(password) });
      this.logger.log('Demo account created');
    } catch (e) {
      this.logger.warn(`Demo account not created: ${(e as Error).message}`);
    }
  }
}

@Module({
  imports: [
    JwtModule.register({
      secret: config.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    JwtAuthGuard,
    RegisterUseCase,
    LoginUseCase,
    GetProfileUseCase,
    DemoAccountSeeder,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
  ],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
