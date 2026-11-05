import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app.error';
import {
  normalizeEmail,
  PASSWORD_HASHER,
  PasswordHasherPort,
  PublicUser,
  TOKEN_ISSUER,
  TokenIssuerPort,
  toPublicUser,
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../domain/user.entity';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuerPort,
  ) {}

  async execute(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) {
      throw new AppError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.', HttpStatus.CONFLICT);
    }
    const user = await this.users.create({
      email,
      name: input.name.trim(),
      passwordHash: await this.hasher.hash(input.password),
    });
    return { token: await this.tokens.issue(user), user: toPublicUser(user) };
  }
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuerPort,
  ) {}

  async execute(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    // Same message for unknown e-mail and wrong password: do not reveal which accounts exist.
    const valid = user ? await this.hasher.verify(input.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new AppError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', HttpStatus.UNAUTHORIZED);
    }
    await this.users.touchLastLogin(user.id);
    return { token: await this.tokens.issue(user), user: toPublicUser(user) };
  }
}

@Injectable()
export class GetProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'La sesión ya no es válida.', HttpStatus.UNAUTHORIZED);
    }
    return toPublicUser(user);
  }
}
