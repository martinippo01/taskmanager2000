import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { Injectable } from '@nestjs/common';
import { InputParams } from 'shared/lib/WorkflowInput';
import { parse } from 'yaml';

@Injectable()
class WorkflowPlanDomainImpl implements WorkflowPlanDomain {
  async getPlanProperties(
    plan: File,
  ): Promise<{ name: string; description: string; inputParams: InputParams }> {
    const arrayBuffer = await plan.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const parsed = parse(fileContent);
    const name = parsed.name;
    const description = parsed.description;
    const inputParams = {};

    for (const step of parsed.steps) {
      for (const param of step.params) {
        inputParams[param.name] = param.type;
      }
    }

    return { name, description, inputParams };
  }

  async isPlanFormatValid(plan: File): Promise<boolean> {
    try {
      const arrayBuffer = await plan.arrayBuffer();
      const fileContent = Buffer.from(arrayBuffer).toString('utf8');
      const parsed = parse(fileContent);
      if (!parsed || typeof parsed !== 'object') return false;
      // const parsed = JSON.parse(parsedFirst);

      // Validate top-level structure
      if (!parsed.name || typeof parsed.name !== 'string') return false;
      if (!parsed.description || typeof parsed.description !== 'string')
        return false;
      if (!Array.isArray(parsed.steps)) return false;

      const stepNames = new Set();
      const paramNames = new Set();

      // Validate each step
      for (const step of parsed.steps) {
        if (!step.name || typeof step.name !== 'string') return false;
        if (stepNames.has(step.name)) return false; // Step names must be unique
        stepNames.add(step.name);

        // TODO: Sacar esta info del Task manager
        if (
          !step.task ||
          !['echo', 'bash', 's3', 'filter', 'manual'].includes(step.task)
        )
          return false;

        if (!Array.isArray(step.params) || step.params.length === 0)
          return false;

        // Validate each parameter in the step
        for (const param of step.params) {
          if (
            !param.name ||
            typeof param.name !== 'string' ||
            paramNames.has(param.name)
          )
            return false;
          paramNames.add(param.name);

          // TODO: ver si no hay que agregar alguno más
          if (!['string', 'number', 'boolean'].includes(param.type))
            return false;

          const from = param.from;
          const value = param.value;
          // Ensure `from` and `value` are mutually exclusive
          if ((from && value) || (!from && !value)) return false;
          if (from && (typeof from !== 'string' || !stepNames.has(from)))
            return false;
          if (value && typeof value !== 'string') return false;

          // Validate `constant` (default is false if not provided)
          if (
            param.constant !== undefined &&
            typeof param.constant !== 'boolean'
          )
            return false;
        }
      }

      return true;
    } catch (err) {
      throw new Error(`Failed to parse plan YAML: ${err.message}`);
    }
  }
}

export default WorkflowPlanDomainImpl;
