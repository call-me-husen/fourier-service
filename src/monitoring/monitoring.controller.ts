import { Controller, Get, UseGuards, Res, Req } from '@nestjs/common';
import type { Response } from 'express';
import { MonitoringService } from './monitoring.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { AccountRole } from '../database/entities';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: AccountRole;
  };
}

@Controller('api/monitoring')
@UseGuards(JwtGuard, RoleGuard)
@Roles(AccountRole.ADMIN)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('employee-changes/stream')
  stream(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const clientId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.monitoringService.addClient(clientId, res);

    const keepAliveInterval = setInterval(() => {
      res.write(
        `event: keepalive\ndata: ${JSON.stringify({ timestamp: new Date() })}\n\n`,
      );
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAliveInterval);
      this.monitoringService.removeClient(clientId);
      res.end();
    });
  }
}
