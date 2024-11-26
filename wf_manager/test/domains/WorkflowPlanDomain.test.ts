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
    `, // Simulates arrayBuffer content
      ),
    };

    // Call the method
    const result = await service.getPlanProperties(mockFile as any);

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

    const result = await service.getPlanProperties(mockFile as any);

    expect(result).toEqual({
      name: 'Empty Plan',
      description: 'No steps here',
      inputParams: {},
    });
  });

  it('should throw an error for invalid YAML', async () => {
    // Mock invalid YAML content
    const mockFile = {
      arrayBuffer: jest
        .fn()
        .mockResolvedValueOnce(Buffer.from(`invalid: yaml: content`).buffer),
    };

    await expect(service.getPlanProperties(mockFile as any)).rejects.toThrow();
  });
});
