import WorkflowPlanDomain from '@interfaces/WorkflowPlanDomain.js';

class WorkflowPlanDomainImpl implements WorkflowPlanDomain {
  isPlanFormatValid(plan: File): boolean {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowPlanDomainImpl;
