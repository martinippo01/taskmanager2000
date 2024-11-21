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
import { WorkflowPlanDao } from '@interfaces/repositories/WorkflowPlanDao';
import WorkflowPlanDaoImpl from '@repositories/WorkflowPlanDaoImpl';

@Module({
  imports: [],
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
      provide: WorkflowPlanDao,
      useClass: WorkflowPlanDaoImpl,
    },
  ],
})
export class AppModule {}
