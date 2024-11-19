import WorkflowPlanDomain from '@interfaces/WorkflowPlanDomain.js';

class WorkflowPlanDomainMock implements WorkflowPlanDomain {
  isPlanFormatValid(plan: File): boolean {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowPlanDomainMock;
