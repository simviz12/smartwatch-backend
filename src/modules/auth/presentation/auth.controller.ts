import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Request } from 'express';
import { AppError } from '../../../shared/errors/app.error';
import { GetProfileUseCase, LoginUseCase, RegisterUseCase } from '../application/auth.use-cases';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail({}, { message: 'Escribe un correo válido.' })
  @MaxLength(120)
  email!: string;

  @ApiProperty({ example: 'una-contraseña-segura' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'profesor@pulso.app' })
  @IsEmail({}, { message: 'Escribe un correo válido.' })
  email!: string;

  @ApiProperty({ example: 'Pulso2026!' })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

interface AuthedRequest extends Request {
  userId?: string;
}

/** Accepts `Authorization: Bearer <jwt>` and exposes the user id on the request. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError('UNAUTHORIZED', 'Inicia sesión para continuar.', HttpStatus.UNAUTHORIZED);
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      req.userId = payload.sub;
      return true;
    } catch {
      throw new AppError('UNAUTHORIZED', 'Tu sesión expiró. Vuelve a iniciar sesión.', HttpStatus.UNAUTHORIZED);
    }
  }
}

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly profile: GetProfileUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account and return a session token' })
  signUp(@Body() dto: RegisterDto) {
    return this.register.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with e-mail and password' })
  signIn(@Body() dto: LoginDto) {
    return this.login.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current signed-in user' })
  me(@Req() req: AuthedRequest) {
    return this.profile.execute(req.userId as string);
  }
}
