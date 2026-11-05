export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/** What the API returns about a user: never the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; name: string; passwordHash: string }): Promise<User>;
  touchLastLogin(id: string): Promise<void>;
}

export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenIssuerPort {
  issue(user: User): Promise<string>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

/** Normalises e-mails so "Ana@Mail.com " and "ana@mail.com" are the same account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
