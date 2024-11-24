import { Workflow } from '@interfaces/types/Workflow';
import { WorkflowExecutionGateway } from '@interfaces/gateways/WorkflowExecutionGateway';
import { Injectable } from '@nestjs/common';
import { InputArguments } from '@interfaces/types/WorkflowInput';

@Injectable()
class WorkflowExecutionGatewayImpl implements WorkflowExecutionGateway {
  queueWorkflow(
    workflow: Workflow,
    inputArgs: InputArguments,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowExecutionGatewayImpl;
