import { Module } from '@nestjs/common';
import { NotificationGateway } from '../../application/notification.gateway.js';
import { LoggerNotificationGateway } from './logger-notification.gateway.js';

@Module({
  providers: [
    { provide: NotificationGateway, useClass: LoggerNotificationGateway },
  ],
  exports: [NotificationGateway],
})
export class NotificationModule {}
