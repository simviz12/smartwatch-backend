import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { ChatModule } from './modules/chat/chat.module';
import { InstallModule } from './modules/install/install.module';
import { PrivacyLogger } from './shared/logging/privacy-logger.service';
import { HttpLoggingMiddleware } from './shared/logging/http-logging.middleware';

@Module({
  imports: [HealthModule, ChatModule, InstallModule],
  providers: [PrivacyLogger],
  exports: [PrivacyLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggingMiddleware).forRoutes('*');
  }
}
