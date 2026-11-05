import { AppError } from '../../../shared/errors/app.error';
import { BcryptPasswordHasher } from '../infrastructure/auth.adapters';
import { TokenIssuerPort, User, UserRepositoryPort } from '../domain/user.entity';
import { GetProfileUseCase, LoginUseCase, RegisterUseCase } from './auth.use-cases';

class InMemoryUsers implements UserRepositoryPort {
  readonly rows: User[] = [];
  async findByEmail(email: string) {
    return this.rows.find((u) => u.email === email) ?? null;
  }
  async findById(id: string) {
    return this.rows.find((u) => u.id === id) ?? null;
  }
  async create(data: { email: string; name: string; passwordHash: string }) {
    const user: User = { id: `u${this.rows.length + 1}`, createdAt: new Date(), lastLoginAt: null, ...data };
    this.rows.push(user);
    return user;
  }
  async touchLastLogin(id: string) {
    const u = this.rows.find((r) => r.id === id);
    if (u) u.lastLoginAt = new Date();
  }
}

const tokens: TokenIssuerPort = { issue: async (u) => `token-${u.id}` };

describe('Auth use cases', () => {
  let users: InMemoryUsers;
  const hasher = new BcryptPasswordHasher();

  beforeEach(() => {
    users = new InMemoryUsers();
  });

  it('registers a user, normalises the e-mail and never stores the plain password', async () => {
    const res = await new RegisterUseCase(users, hasher, tokens).execute({
      name: ' Ana ',
      email: ' Ana@Mail.COM ',
      password: 'secreta123',
    });
    expect(res.user.email).toBe('ana@mail.com');
    expect(res.user.name).toBe('Ana');
    expect(res.token).toBe('token-u1');
    expect(users.rows[0].passwordHash).not.toContain('secreta123');
    expect(res.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a second account with the same e-mail', async () => {
    const register = new RegisterUseCase(users, hasher, tokens);
    await register.execute({ name: 'Ana', email: 'ana@mail.com', password: 'secreta123' });
    await expect(register.execute({ name: 'Otra', email: 'ANA@mail.com', password: 'otraclave1' })).rejects.toMatchObject({
      code: 'EMAIL_TAKEN',
      statusCode: 409,
    });
  });

  it('signs in with the right password and records the login time', async () => {
    await new RegisterUseCase(users, hasher, tokens).execute({ name: 'Ana', email: 'ana@mail.com', password: 'secreta123' });
    const res = await new LoginUseCase(users, hasher, tokens).execute({ email: 'ANA@mail.com', password: 'secreta123' });
    expect(res.token).toBe('token-u1');
    expect(users.rows[0].lastLoginAt).not.toBeNull();
  });

  it('gives the same error for wrong password and unknown e-mail', async () => {
    await new RegisterUseCase(users, hasher, tokens).execute({ name: 'Ana', email: 'ana@mail.com', password: 'secreta123' });
    const login = new LoginUseCase(users, hasher, tokens);
    const wrong = await login.execute({ email: 'ana@mail.com', password: 'mala' }).catch((e: AppError) => e);
    const unknown = await login.execute({ email: 'nadie@mail.com', password: 'secreta123' }).catch((e: AppError) => e);
    expect(wrong).toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    expect(unknown).toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    expect((wrong as AppError).message).toBe((unknown as AppError).message);
  });

  it('returns the profile of an existing user and rejects a deleted one', async () => {
    await new RegisterUseCase(users, hasher, tokens).execute({ name: 'Ana', email: 'ana@mail.com', password: 'secreta123' });
    const profile = new GetProfileUseCase(users);
    await expect(profile.execute('u1')).resolves.toMatchObject({ email: 'ana@mail.com' });
    await expect(profile.execute('missing')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
