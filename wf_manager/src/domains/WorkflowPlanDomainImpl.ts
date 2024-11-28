import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { Injectable } from '@nestjs/common';
import { InputParams } from 'shared/lib/WorkflowInput';
import { Param, Plan, Step } from 'shared/lib/WorkflowPlan';
import { parse } from 'yaml';

@Injectable()
class WorkflowPlanDomainImpl implements WorkflowPlanDomain {
  async getPlanProperties(fileContent: string): Promise<{
    name: string;
    description: string;
    inputParams: InputParams;
    version: string;
  }> {
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

  async getPlanFromYaml(fileContent: string): Promise<Plan> {
    const throw_excep = () => {
      throw new InvalidWorkflowPlanException();
    };

    const parsed = parse(fileContent);
    if (!parsed || typeof parsed !== 'object') throw_excep();
    // const parsed = JSON.parse(parsedFirst);

    // Validate top-level structure
    if (!parsed.name || typeof parsed.name !== 'string') throw_excep();
    if (!parsed.description || typeof parsed.description !== 'string')
      throw_excep();
    if (!Array.isArray(parsed.steps)) throw_excep();

    const stepNames: Set<string> = new Set();
    const paramNames: Set<string> = new Set();
    const steps: Step[] = [];

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
      current_step.task = step.task;

      const params: Param[] = [];
      // Validate each parameter in the step
      for (const parameter of step.params) {
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

        const from = parameter.from;
        const value = parameter.value;
        // Ensure `from` and `value` are mutually exclusive
        if ((from && value) || (!from && !value)) throw_excep();
        if (from) {
          if (typeof from !== 'string' || !stepNames.has(from)) throw_excep();
        } else if (value) {
          if (typeof value !== 'string') throw_excep();
        }

        // Validate `constant` (default is false if not provided)
        if (
          parameter.constant !== undefined &&
          typeof parameter.constant !== 'boolean'
        )
          throw_excep();

        const param: Param = {
          name: parameter.name,
          type: parameter.type,
          ...(parameter.from
            ? { from: parameter.from }
            : {
                value: parameter.value,
                ...(parameter.constant ? { constant: parameter.constant } : {}),
              }),
        };

        params.push(param);
      }

      current_step.params = params;
      steps.push(current_step as Step);
    }

    return { steps };
  }
}

export default WorkflowPlanDomainImpl;
