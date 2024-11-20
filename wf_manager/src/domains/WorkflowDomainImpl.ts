import { Workflow } from '@interfaces/types/Workflow.js';
import { WorkflowDomain } from '@interfaces/domains/WorkflowDomain.js';
import { Injectable } from '@nestjs/common';
import { WorkflowDao } from '@interfaces/repositories/WorkflowDao';
import { WorkflowCreation } from '@interfaces/types/CreateWorkflow';
import { InputParamType } from '@interfaces/types/Workflow'
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { WorkflowInputDomain } from '@interfaces/domains/WorkflowInputDomain';

@Injectable()
class WorkflowDomainImpl implements WorkflowDomain {
  constructor(private workflowDao: WorkflowDao, 
    private readonly workflowPlanDomain: WorkflowPlanDomain, 
    private readonly workflowInputDomain: WorkflowInputDomain) {}

  async createWorkflow(request: WorkflowCreation): Promise<Workflow | null> {
    const wf = await this.workflowDao.getWorkflow(request.name);
    // Return null if it already exists
    if (wf!==null || this.workflowPlanDomain.isPlanFormatValid(wf.plan)) 
      return null;
    
    //TODO: revisar validez de los inputParams
   
    const newWorkflow: Workflow = {
      version: "1", 
      name: request.name,
      description: request.description,
      inputParams: request.inputParams,
      plan: request.plan,
    };

    this.workflowDao.createWorkflow(newWorkflow);
    return newWorkflow;
  }

  // esto quizás no debería estar acá
  async doesWorkflowExist(name: string): Promise<boolean> {
    return await this.workflowDao.getWorkflow(name)!==null; 
  }

  async isWorkflowEnabled(name: string): Promise<boolean> {
    const wf_entity = await this.workflowDao.getWorkflow(name);
    if (!wf_entity)
      return null;
    return wf_entity.enabled;
  }

  async toggleWorkflow(name: string): Promise<boolean> {
    const wf_entity = await this.workflowDao.getWorkflow(name);
     
    if (!wf_entity)
      return null;

    // dependiendo de qué devuelven disable y enable quizás 
    // convenga borrar el primer return y descomentar el segundo
    return wf_entity.enabled 
    ? await this.workflowDao.disableWorkflow(wf_entity.name)
    : await this.workflowDao.enableWorkflow(wf_entity.name);

    // return !wf_entity.enabled;
  }

  async getWorkflow(name: string): Promise<Workflow | null> {
    const wf_entity = await this.workflowDao.getWorkflow(name);
     
    if (!wf_entity)
      return null;

    const inputParams: Record<string, InputParamType> = {};
    wf_entity.inputParams.forEach(param => {
      // TODO: conseguimos los params
      //this.workflowInputDomain.getInputArgs()
    });

    return { 
      version: wf_entity.version,
      name: name,
      description: wf_entity.description,
      inputParams: inputParams,
      plan: wf_entity.plan }
  }
}

export default WorkflowDomainImpl;
