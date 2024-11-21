import {
  Workflow,
  InputArguments,
  InputParams,
} from '@interfaces/types/Workflow';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { Injectable } from '@nestjs/common';

@Injectable()
class WorkflowInputDomainImpl implements WorkflowInputDomain {
  areInputParamsValid(
    plan: File,
    inputParams: Record<string, string>,
  ): InputParams {
    throw new Error('Method not implemented.');
  }

  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string>,
  ): InputArguments {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowInputDomainImpl;
