// Match backend types
export type Id<T extends string> = string & { __brand: T };

export interface QaRunEntity {
  id: Id<'qaRun'>;
  createdAt: string;
  updatedAt: string;
  repoUrl: string;
  appName: string;
  branch: string;
  daytonaWorkspaceId: string;
  appLocalUrl: string;
  testFlowIds: Id<'testFlow'>[];
  status: 'pending' | 'setting_up' | 'running_tests' | 'completed' | 'failed';
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  videoRecordingUrl: string | null;
  videoRecordingPath: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TestFlowEntity {
  id: Id<'testFlow'>;
  createdAt: string;
  name: string;
  description: string;
  task: string;
  isDemo: boolean;
}

export interface TestStepEntity {
  id: Id<'testStep'>;
  createdAt: string;
  qaRunId: Id<'qaRun'>;
  testFlowId: Id<'testFlow'>;
  stepNumber: number;
  actionName: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  executedAt: string | null;
  screenshotBase64: string | null;
  errorMessage: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
