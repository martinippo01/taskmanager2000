import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { Injectable } from '@nestjs/common';

@Injectable()
class WorkflowPlanDomainImpl implements WorkflowPlanDomain {
  isPlanFormatValid(plan: File): boolean {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowPlanDomainImpl;
