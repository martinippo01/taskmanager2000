import { WorkflowPlanDao } from '@interfaces/repositories/WorkflowPlanDao';

class WorkflowPlanDaoImpl extends WorkflowPlanDao {
  savePlan(plan: File): Promise<string> {
    throw new Error('Method not implemented.');
  }

  getPlan(id: string): Promise<File | null> {
    throw new Error('Method not implemented.');
  }
}

export default WorkflowPlanDaoImpl;
