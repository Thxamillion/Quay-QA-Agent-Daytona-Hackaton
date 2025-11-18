import type { ApiResponse, QaRunEntity, TestFlowEntity, TestStepEntity, Id } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Generic API call function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Test Flow API
export const testFlowApi = {
  getAll: () => apiCall<TestFlowEntity[]>('/api/test-flow'),
  getById: (id: Id<'testFlow'>) => apiCall<TestFlowEntity>(`/api/test-flow/${id}`),
  create: (data: Omit<TestFlowEntity, 'id' | 'createdAt'>) =>
    apiCall<TestFlowEntity>('/api/test-flow', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// QA Run API
export const qaRunApi = {
  getAll: () => apiCall<QaRunEntity[]>('/api/qa-run'),
  getById: (id: Id<'qaRun'>) => apiCall<QaRunEntity>(`/api/qa-run/${id}`),
  getSteps: (id: Id<'qaRun'>) => apiCall<TestStepEntity[]>(`/api/qa-run/${id}/steps`),
  create: (data: {
    repoUrl: string;
    appName: string;
    branch: string;
    testFlowIds: Id<'testFlow'>[];
  }) =>
    apiCall<QaRunEntity>('/api/qa-run', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
