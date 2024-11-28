import InvalidWorkflowPlanException from '@exceptions/InvalidWorkflowPlanException';
import WorkflowPlanDomainImpl from '../../src/domains/WorkflowPlanDomainImpl';
import { WorkflowPlanDomain } from '../../src/interfaces/domains/WorkflowPlanDomain';
import { Test, TestingModule } from '@nestjs/testing';

describe('PlanDomain', () => {
  let service: WorkflowPlanDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowPlanDomain,
          useClass: WorkflowPlanDomainImpl,
        },
      ],
    }).compile();

    service = module.get<WorkflowPlanDomain>(WorkflowPlanDomain);
  });

  it('should parse plan properties correctly', async () => {
    // Mock the File object
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Test Plan
          description: A description of the test plan
          steps:
            - name: hola
              task: echo
              params:
                - name: param1
                  type: string
                  value: a_completar_1
                - name: param2
                  type: number
                  value: a_completar_2
                  constant: true
            - name: jajaja
              task: bash
              params:
                - name: param3
                  type: boolean
                  from: hola
                - name: param4
                  type: string[]
                  value: a_completar_3
        `, // Use Buffer to properly simulate arrayBuffer
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const result = await service.getPlanProperties(fileContent);

    // Expected Output
    expect(result).toEqual({
      name: 'Test Plan',
      description: 'A description of the test plan',
      inputParams: {
        param1: 'string',
        param2: 'number',
        param3: 'boolean',
        param4: 'string[]',
      },
    });
  });

  it('should handle empty steps gracefully', async () => {
    // Mock File with empty steps
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
      name: Empty Plan
      description: No steps here
      steps: []
    `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const result = await service.getPlanProperties(fileContent);

    expect(result).toEqual({
      name: 'Empty Plan',
      description: 'No steps here',
      inputParams: {},
    });
  });

  it('should throw an error for invalid YAML', async () => {
    // Mock invalid YAML content
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(`invalid: yaml: content`),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanProperties(fileContent)).rejects.toThrow();
  });

  it('should return true for a valid plan format', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Valid Plan
          description: A properly structured plan
          steps:
            - name: step1
              task: echo
              params:
                - name: param1
                  type: string
                  value: hello
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const result = await service.getPlanFromYaml(fileContent);
    expect(result.steps.at(0)?.name).toBe('step1');
    expect(result.steps.at(0)?.task).toBe('echo');
    const param1 = result.steps[0].params[0] as {
      name: string;
      type: string;
      value: string;
    };
    expect('value' in param1).toBe(true); // Explicit check for value
    expect(param1.value).toBe('hello'); // Direct access
  });

  it('should return false for a plan missing top-level name or description', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          description: Missing name
          steps: 
            - name: step1
              task: echo
              params:
                - name: param1
                  type: string
                  value: hello
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false for a plan with missing or invalid steps', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Invalid Steps Plan
          description: Steps are missing
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false for a plan with duplicate step names', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Duplicate Steps Plan
          description: Plan with duplicate steps
          steps:
            - name: step1
              task: echo
              params: 
                - name: param1
                  type: string
                  value: hello
            - name: step1
              task: bash
              params:
                - name: param2
                  type: string
                  value: hello
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false for a plan with duplicate param names', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Duplicate Steps Plan
          description: Plan with duplicate steps
          steps:
            - name: step1
              task: echo
              params: 
                - name: param1
                  type: string
                  value: hello
            - name: step2
              task: bash
              params:
                - name: param1
                  type: string
                  value: hello
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false for an empty plan', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(``),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false for a step without params array', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Plan Without Params
          description: A step is missing params
          steps:
            - name: step1
              task: echo
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false if a parameter references an invalid step in from', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Invalid From Reference
          description: Invalid reference in from
          steps:
            - name: step1
              task: echo
              params:
                - name: param1
                  type: string
                  from: nonExistentStep
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return true for a valid plan with nested parameters', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Nested Parameters Plan
          description: A valid plan with nested parameters
          steps:
            - name: step1
              task: bash
              params:
                - name: param1
                  type: string
                  value: hello
            - name: step2
              task: echo
              params:
                - name: param2
                  type: string
                  from: step1
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const result = await service.getPlanFromYaml(fileContent);
    expect(result.steps.at(0)?.name).toBe('step1');
    expect(result.steps.at(0)?.task).toBe('bash');
    const param1 = result.steps[0].params[0] as {
      name: string;
      type: string;
      value: string;
    };
    expect('value' in param1).toBe(true);
    expect(param1.value).toBe('hello');

    expect(result.steps.at(1)?.name).toBe('step2');
    expect(result.steps.at(1)?.task).toBe('echo');
    const param2 = result.steps[1].params[0] as {
      name: string;
      type: string;
      from: string;
    };
    expect('from' in param2).toBe(true);
    expect('value' in param2).toBe(false);
    expect(param2.from).toBe('step1');
  });

  it('should return false for a step with an invalid name', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Invalid Step Name
          description: A step has an invalid name
          steps:
            - name: ""
              task: echo
              params: []
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should return false for a step without a task', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Missing Task Plan
          description: A step is missing a task
          steps:
            - name: step1
              params:
                - name: param1
                  type: string
                  value: hello
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });

  it('should ignore unknown fields but validate known fields', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Plan With Extra Fields
          description: Plan contains extra invalid fields
          steps:
            - name: step1
              task: echo
              params:
                - name: param1
                  type: string
                  value: hello
              extraField: shouldBeIgnored
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');
    const result = await service.getPlanFromYaml(fileContent);
    expect(result.steps.at(0)?.name).toBe('step1');
    expect(result.steps.at(0)?.task).toBe('echo');
    const param1 = result.steps[0].params[0] as {
      name: string;
      type: string;
      value: string;
    };
    expect('value' in param1).toBe(true); // Explicit check for value
    expect(param1.value).toBe('hello'); // Direct access
  });

  it('should return false if steps is not an array', async () => {
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(
        `
          name: Non-Array Steps Plan
          description: Steps is not an array
          steps: invalidStructure
        `,
      ),
    };

    const arrayBuffer = await mockFile.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf8');

    await expect(service.getPlanFromYaml(fileContent)).rejects.toThrow(
      InvalidWorkflowPlanException,
    );
  });
});
