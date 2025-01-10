import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import {
  KafkaStepScheduleRequestClient,
  KafkaStepScheduleRequestClientFactoryProvider,
} from './configs/KafkaStepScheduleRequestConfig';
import { ConfigModuleValidationSchema } from './configs/ConfigValidationSchema';
import { SchedulerDomain } from '@interfaces/domains/SchedulerDomain';
import SchedulerDomainImpl from '@domains/SchedulerDomainImpl';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: ConfigModuleValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: KafkaStepScheduleRequestClient,
        useFactory: KafkaStepScheduleRequestClientFactoryProvider,
      },
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: SchedulerDomain,
      useClass: SchedulerDomainImpl,
    },
  ],
})
export class AppModule {}
