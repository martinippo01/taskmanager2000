import { Module } from '@nestjs/common';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import WorkflowControllerRestImpl from '@controllers/WorkflowControllerRestImpl';
import WorkflowDomainImpl from '@domains/WorkflowDomainImpl';
import WorkflowInputDomainImpl from '@domains/WorkflowInputDomainImpl';
import WorkflowPlanDomainImpl from '@domains/WorkflowPlanDomainImpl';
import WorkflowExecutionGatewayImpl from '@gateways/WorkflowExecutionGatewayImpl';
import WorkflowDaoImpl from '@repositories/WorkflowDaoImpl';
import {
  redisClientFactory,
  RedisRepositoryImpl,
} from '@repositories/RedisRepositoryImpl';
import { RedisRepository } from '@interfaces/repositories/RedisRepository';
import { WorkflowExecutionRequestProducer } from '@interfaces/types/WorkflowExecutionRequestProducer';
import { WorkflowExecutionRequestProducer as WorkflowExecutionRequestProducerImpl } from '@shared/WorkflowExecutionRequest';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [WorkflowControllerRestImpl],
  providers: [
    {
      provide: WorkflowDomain,
      useClass: WorkflowDomainImpl,
    },
    {
      provide: WorkflowInputDomain,
      useClass: WorkflowInputDomainImpl,
    },
    {
      provide: WorkflowPlanDomain,
      useClass: WorkflowPlanDomainImpl,
    },
    {
      provide: WorkflowExecutionGateway,
      useClass: WorkflowExecutionGatewayImpl,
    },
    {
      provide: WorkflowDao,
      useClass: WorkflowDaoImpl,
    },
    {
      provide: RedisRepository,
      useClass: RedisRepositoryImpl,
    },
    {
      provide: WorkflowExecutionRequestProducer,
      useClass: WorkflowExecutionRequestProducerImpl,
    },
    redisClientFactory,
  ],
})
export class AppModule {}
