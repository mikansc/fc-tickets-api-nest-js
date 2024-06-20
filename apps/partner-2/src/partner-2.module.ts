import { PrismaModule } from '@app/core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from 'apps/partner-1/src/events/events.module';
import { SpotsModule } from 'apps/partner-1/src/spots/spots.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.partner-2' }),
    PrismaModule,
    EventsModule,
    SpotsModule,
  ],
})
export class Partner2Module {}
