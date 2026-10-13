import { Module } from '@nestjs/common';
import { InstallController } from './presentation/install.controller';

@Module({
  controllers: [InstallController],
})
export class InstallModule {}
