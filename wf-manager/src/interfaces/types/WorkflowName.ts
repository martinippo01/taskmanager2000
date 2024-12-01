import { IsAscii, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const workflowNameMaxLen = 255;

export class WorkflowNameParam {
  @IsNotEmpty({
    message: 'Workflow name is required',
  })
  @IsString({
    message: 'Workflow name must be a string',
  })
  @IsAscii({
    message: 'Workflow name must be an ASCII string',
  })
  @MaxLength(workflowNameMaxLen, {
    message: `Workflow name must be at most ${workflowNameMaxLen} characters`,
  })
  name: string;
}
