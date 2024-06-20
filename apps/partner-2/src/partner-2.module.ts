import { Module } from '@nestjs/common';
import { SpotsCoreModule } from '@app/core/spots/spots-core.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.partner-2' }),
    SpotsCoreModule,
  ],
})
export class Partner2Module {}
