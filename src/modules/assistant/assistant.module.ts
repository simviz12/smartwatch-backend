import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Module, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Request } from 'express';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/presentation/auth.controller';
import {
  ASSISTANT_LLM,
  ASSISTANT_RATE_LIMITER,
  AskAssistantUseCase,
  AssistantLlmPort,
} from './application/ask-assistant.use-case';
import { GeminiAssistantAdapter, InMemoryRateLimiter } from './infrastructure/assistant.adapters';

export class AssistantTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  text!: string;
}

export class AskAssistantDto {
  @ApiProperty({ example: 'Me siento muy presionado con el trabajo' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ enum: ['ES', 'EN'], default: 'ES' })
  @IsOptional()
  @IsIn(['ES', 'EN', 'es', 'en'])
  language?: string;

  @ApiPropertyOptional({ type: [AssistantTurnDto], description: 'Last turns of the conversation (max 10)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AssistantTurnDto)
  history?: AssistantTurnDto[];
}

@ApiTags('Assistant')
@Controller('v1/assistant')
export class AssistantController {
  constructor(
    private readonly ask: AskAssistantUseCase,
    @Inject(ASSISTANT_LLM) private readonly llm: AssistantLlmPort,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Whether the AI assistant is configured on the server' })
  status() {
    return { aiConfigured: this.llm.configured };
  }

  @Post('reply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Answer a message with the AI assistant (key stays on the server)' })
  reply(@Body() dto: AskAssistantDto, @Req() req: Request & { userId?: string }) {
    return this.ask.execute({ userId: req.userId as string, message: dto.message, language: dto.language, history: dto.history });
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AssistantController],
  providers: [
    AskAssistantUseCase,
    { provide: ASSISTANT_LLM, useClass: GeminiAssistantAdapter },
    { provide: ASSISTANT_RATE_LIMITER, useFactory: () => new InMemoryRateLimiter(30, 60 * 60 * 1000) },
  ],
})
export class AssistantModule {}
