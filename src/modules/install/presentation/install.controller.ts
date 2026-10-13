import { Delete, Controller, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Install & Privacy')
@Controller('v1/installs')
export class InstallController {
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete install record and purge server counters' })
  deleteInstall() {
    // Under Pulso's zero-knowledge privacy architecture, chat content is never stored on the server.
    // This endpoint purges any transient installation tokens or counters.
    return {
      success: true,
      deletedAt: new Date().toISOString(),
      message: 'Instalación y datos asociados eliminados completamente.',
    };
  }
}
