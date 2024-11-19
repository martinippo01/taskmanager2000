import { InputArgumentType } from '@interfaces/Workflow.js';
import WorkflowInputDomain from '@interfaces/WorkflowInputDomain.js';

class WorkflowInputDomainMock implements WorkflowInputDomain {
  areInputParamsValid(inputParams: Record<string, string>): boolean {
    throw new Error('Method not implemented.');
  }

  getInputArgs(
    inputArgs: Record<string, string>
  ): Record<string, InputArgumentType> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowInputDomainMock;
