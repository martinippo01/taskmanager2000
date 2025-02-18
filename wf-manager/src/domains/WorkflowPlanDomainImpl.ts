import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import { WorkflowPlanDomain } from '@interfaces/domains/WorkflowPlanDomain';
import { workflowNameMaxLen } from '@interfaces/types/WorkflowName';
import { Injectable, Logger } from '@nestjs/common';
import { InputParams } from '@shared/WorkflowInput';
import { Param, Plan, Step } from '@shared/WorkflowPlan';
import { parse } from 'yaml';

const validTasks = [
  'echo',
  'bash',
  's3_upload',
  's3_download',
  'decision',
  'upper',
  'lower',
] as const;
const validTaskTypes = ['string', 'number', 'boolean'] as const;

@Injectable()
class WorkflowPlanDomainImpl implements WorkflowPlanDomain {
  private readonly LOGGER = new Logger(WorkflowPlanDomainImpl.name);

  async getPlanProperties(fileContent: string): Promise<{
    name: string;
    description: string;
    inputParams: InputParams;
    version: string;
  }> {
    this.LOGGER.debug('Parsing plan');
    const parsed = parse(fileContent);
    const inputParams = {};

    // SI ALGO ESTÁ ROTO PUEDE SER QUE SEA PORQUE CAMBIÉ param.name a param.value
    for (const step of parsed.steps) {
      for (const param of step.params) {
        if ('value' in param && (!('constant' in param) || !param.constant)) {
          if ('from' in param) {
            throw new InvalidWorkflowPlanException(
              `Parameter ${param.name} has both 'from' and 'value' fields`,
            );
          }
          inputParams[param.value] = param.type;
        }
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
    const throw_excep = (reason?: string) => {
      throw new InvalidWorkflowPlanException(reason);
    };

    this.LOGGER.debug('Parsing plan');
    const parsed = parse(fileContent);
    this.LOGGER.debug('Validating plan format');
    if (!parsed || typeof parsed !== 'object') throw_excep('Invalid YAML');
    // const parsed = JSON.parse(parsedFirst);

    // Validate top-level structure
    this.LOGGER.debug('Validating top-level structure');
    if (!parsed.name || typeof parsed.name !== 'string')
      throw_excep('Workflow name is required');
    if (parsed.name.length === 0)
      throw_excep('Workflow name must not be empty');
    if (parsed.name.length > workflowNameMaxLen)
      throw_excep(
        `Workflow name must be less than ${workflowNameMaxLen} characters`,
      );
    if (!parsed.description || typeof parsed.description !== 'string')
      throw_excep('Workflow description is required');
    if (!parsed.version || typeof parsed.version !== 'string')
      throw_excep('Workflow version is required');
    if (!Array.isArray(parsed.steps))
      throw_excep('Workflow steps are required');

    const stepNames: Set<string> = new Set();
    const steps: Step[] = [];

    // Validate each step
    this.LOGGER.debug('Validating steps');
    const i: number = 0;
    for (const step of parsed.steps) {
      const paramNames: Set<string> = new Set();

      this.LOGGER.debug(`Validating step ${i}`);
      this.LOGGER.debug('Validating step name');
      if (!step.name || typeof step.name !== 'string')
        throw_excep(`Step ${i} name is required`);
      if (stepNames.has(step.name))
        throw_excep(`
        Step name ${step.name} is not unique
        `); // Step names must be unique
      stepNames.add(step.name);
      const current_step: Partial<Step> = {};

      this.LOGGER.debug('Validating task');
      if (!step.task || !validTasks.includes(step.task))
        throw_excep(`Step ${step.name} has an invalid task ${step.task}`);

      if (!Array.isArray(step.params) || step.params.length === 0)
        throw_excep(`Step ${step.name} has no parameters`);

      current_step.name = step.name;
      current_step.task = step.task;

      const params: Param[] = [];
      // Validate each parameter in the step
      this.LOGGER.debug('Validating parameters');
      for (const parameter of step.params) {
        if (
          !parameter.name ||
          typeof parameter.name !== 'string' ||
          paramNames.has(parameter.name)
        )
          throw_excep(
            `Step ${step.name} has an invalid parameter${parameter.name ? `: ${parameter.name}` : ''}`,
          );
        paramNames.add(parameter.name);

        if (!validTaskTypes.includes(parameter.type))
          throw_excep(
            `Step ${step.name} has an invalid parameter type${parameter.type ? `: ${parameter.type}` : ''}`,
          );

        const from = parameter.from;
        const value = parameter.value;
        // Ensure `from` and `value` are mutually exclusive
        if ((from && value) || (!from && !value))
          throw_excep(
            `Step ${step.name} parameter ${parameter.name} must have either a 'from' or 'value' field`,
          );
        if (from) {
          if (typeof from !== 'string' || !stepNames.has(from))
            throw_excep(
              `Step ${step.name} parameter ${parameter.name} has an invalid 'from' field: ${from}`,
            );
        } else if (value) {
          if (typeof value !== 'string')
            throw_excep(
              `Step ${step.name} parameter ${parameter.name} has an invalid 'value' field: ${value}`,
            );
        }

        // Validate `constant` (default is false if not provided)
        // Can be defined only if `value` is defined
        this.LOGGER.debug('Validating constant');
        if (parameter.constant !== undefined && value === undefined)
          throw_excep(
            `Step ${step.name} parameter ${parameter.name} has a constant field but no value`,
          );
        if (
          parameter.constant !== undefined &&
          typeof parameter.constant !== 'boolean'
        )
          throw_excep(`
          Step ${step.name} parameter ${parameter.name} has an invalid constant field: ${parameter.constant}`);

        this.LOGGER.debug(`Adding valid parameter ${parameter.name}`);
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

      this.LOGGER.debug(`Adding valid step ${step.name}`);
      current_step.params = params;
      steps.push(current_step as Step);
    }

    return { steps };
  }
}

export default WorkflowPlanDomainImpl;
