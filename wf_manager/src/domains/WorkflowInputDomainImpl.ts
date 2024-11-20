import {
  InputArgumentType,
  Workflow,
  InputParamType,
} from '@interfaces/types/Workflow';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';
import { Injectable } from '@nestjs/common';

@Injectable()
class WorkflowInputDomainImpl implements WorkflowInputDomain {
  areInputParamsValid(
    plan: File,
    inputParams: Record<string, string>,
  ): Record<string, InputParamType> {
    throw new Error('Method not implemented.');
  }

  getInputArgs(
    workflow: Workflow,
    inputArgs: Record<string, string>,
  ): Record<string, InputArgumentType> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowInputDomainImpl;
