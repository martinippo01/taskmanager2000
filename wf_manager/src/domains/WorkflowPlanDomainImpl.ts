import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { Injectable } from '@nestjs/common';
import { InputParams } from 'shared/lib/WorkflowInput';
import { Param, Plan, Step } from 'shared/lib/WorkflowPlan';
import { parse } from 'yaml';

@Injectable()
class WorkflowPlanDomainImpl implements WorkflowPlanDomain {
  async getPlanProperties(plan: File): Promise<{
    name: string;
    description: string;
    inputParams: InputParams;
    version: string;
  }> {
    const arrayBuffer = await plan.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const parsed = parse(fileContent);
    const inputParams = {};

    for (const step of parsed.steps) {
      for (const param of step.params) {
        inputParams[param.name] = param.type;
      }
    }

    return {
      name: parsed.name,
      description: parsed.description,
      inputParams,
      version: parsed.version,
    };
  }

  async getPlanFromYaml(plan: File): Promise<Plan> {
    const throw_excep = () => {
      throw new InvalidWorkflowPlanException();
    };

    try {
      const arrayBuffer = await plan.arrayBuffer();
      const fileContent = Buffer.from(arrayBuffer).toString('utf8');
      const parsed = parse(fileContent);
      if (!parsed || typeof parsed !== 'object') throw_excep();
      // const parsed = JSON.parse(parsedFirst);

      // Validate top-level structure
      if (!parsed.name || typeof parsed.name !== 'string') throw_excep();
      if (!parsed.description || typeof parsed.description !== 'string')
        throw_excep();
      if (!Array.isArray(parsed.steps)) throw_excep();

      const stepNames = new Set();
      const paramNames = new Set();
      const steps = [];

      // Validate each step
      for (const step of parsed.steps) {
        if (!step.name || typeof step.name !== 'string') throw_excep();
        if (stepNames.has(step.name)) throw_excep(); // Step names must be unique
        stepNames.add(step.name);
        const current_step: Partial<Step> = {};

        // TODO: Sacar esta info del Task manager
        if (
          !step.task ||
          !['echo', 'bash', 's3', 'filter', 'manual'].includes(step.task)
        )
          throw_excep();

        if (!Array.isArray(step.params) || step.params.length === 0)
          throw_excep();

        current_step.name = step.name;
        current_step.task = step.taks;

        const params = [];
        // Validate each parameter in the step
        for (const parameter of step.params) {
          const current_param: Partial<Param> = {};

          if (
            !parameter.name ||
            typeof parameter.name !== 'string' ||
            paramNames.has(parameter.name)
          )
            throw_excep();
          paramNames.add(parameter.name);

          // TODO: ver si no hay que agregar alguno más
          if (!['string', 'number', 'boolean'].includes(parameter.type))
            throw_excep();

          current_param.name = parameter.name;
          current_param.type = parameter.type;

          const from = parameter.from;
          const value = parameter.value;
          // Ensure `from` and `value` are mutually exclusive
          if ((from && value) || (!from && !value)) throw_excep();
          if (from) {
            if (typeof from !== 'string' || !stepNames.has(from)) throw_excep();
            (current_param as { from: string }).from = from;
          } else if (value) {
            if (typeof value !== 'string') throw_excep();
            (current_param as { value: string }).value = value;
          }

          // Validate `constant` (default is false if not provided)
          if (
            parameter.constant !== undefined &&
            typeof parameter.constant !== 'boolean'
          )
            throw_excep();
          else
            (current_param as { constant: boolean }).constant =
              parameter.constant;
        }

        current_step.params = params;
        steps.push(current_step);
      }

      return { steps };
    } catch (err) {
      throw new Error(`Failed to parse plan YAML: ${err.message}`);
    }
  }
}

export default WorkflowPlanDomainImpl;
