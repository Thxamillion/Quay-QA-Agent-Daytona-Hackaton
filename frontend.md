# Frontend Implementation Guide - QA Automation Agent

> **Tech Stack**: Next.js 15 + React + TypeScript + TanStack Query + Tailwind + Radix UI + shadcn/ui

---

## 📁 Project Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page (create QA run)
│   │   ├── qa-runs/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # QA run detail + timeline
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ... (other shadcn components)
│   │   │
│   │   ├── QaRunForm.tsx             # Create QA run form
│   │   ├── QaRunTimeline.tsx         # Step-by-step results timeline
│   │   ├── QaRunStats.tsx            # Pass/fail statistics cards
│   │   ├── VideoPlayer.tsx           # Full session video player
│   │   └── TestFlowSelector.tsx      # Test flow selection component
│   │
│   ├── lib/                          # Utilities
│   │   ├── api.ts                    # API client functions
│   │   ├── utils.ts                  # Utility functions (cn, etc.)
│   │   └── query-client.ts           # TanStack Query setup
│   │
│   └── types/                        # TypeScript types
│       └── index.ts                  # Shared types matching backend
│
├── public/                           # Static assets
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
└── .env.local                        # Environment variables
```

---

## 🚀 Step-by-Step Implementation

### Step 1: Project Setup

**1.1 Create Next.js project**
```bash
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir
cd web
```

**1.2 Install dependencies**
```bash
# TanStack Query
npm install @tanstack/react-query

# Radix UI primitives
npm install @radix-ui/react-slot @radix-ui/react-checkbox @radix-ui/react-label

# Utilities
npm install class-variance-authority clsx tailwind-merge lucide-react

# Date utilities (optional)
npm install date-fns
```

**1.3 Initialize shadcn/ui**
```bash
npx shadcn-ui@latest init
```

Select:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

**1.4 Add shadcn/ui components**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add label
```

---

### Step 2: Configuration Files

**2.1 Update `next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
```

**2.2 Create `.env.local`**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**2.3 Update `tailwind.config.ts`**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

### Step 3: Types (`src/types/index.ts`)

```typescript
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
```

---

### Step 4: API Client (`src/lib/api.ts`)

```typescript
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
```

---

### Step 5: Query Client Setup (`src/lib/query-client.ts`)

```typescript
'use client';

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      refetchOnWindowFocus: false,
    },
  },
});
```

---

### Step 6: Utilities (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date helper
export function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

// Format duration helper
export function formatDuration(start: string, end: string): string {
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Get status color helper
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'passed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'running_tests':
    case 'running':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'setting_up':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
```

---

### Step 7: Root Layout (`src/app/layout.tsx`)

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QA Automation Agent',
  description: 'AI-powered QA automation using Daytona and browser-use',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
              <div className="container mx-auto px-4 py-4">
                <h1 className="text-2xl font-bold">QA Automation Agent</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered testing with Daytona + browser-use
                </p>
              </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t mt-16">
              <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                Built for Daytona Hacksprint 2025
              </div>
            </footer>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

---

### Step 8: QA Run Form Component (`src/components/QaRunForm.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testFlowApi, qaRunApi } from '@/lib/api';
import type { Id } from '@/types';

export function QaRunForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [branch, setBranch] = useState('main');
  const [selectedFlows, setSelectedFlows] = useState<Id<'testFlow'>[]>([]);

  // Fetch test flows
  const { data: testFlowsResponse, isLoading } = useQuery({
    queryKey: ['test-flows'],
    queryFn: testFlowApi.getAll,
  });

  const testFlows = testFlowsResponse?.data || [];

  // Create QA run mutation
  const createRun = useMutation({
    mutationFn: qaRunApi.create,
    onSuccess: (response) => {
      if (response.success && response.data) {
        router.push(`/qa-runs/${response.data.id}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRun.mutate({
      repoUrl,
      appName,
      branch,
      testFlowIds: selectedFlows,
    });
  };

  const toggleFlow = (flowId: Id<'testFlow'>) => {
    setSelectedFlows((prev) =>
      prev.includes(flowId)
        ? prev.filter((id) => id !== flowId)
        : [...prev, flowId]
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create QA Run</CardTitle>
        <CardDescription>
          Start a new automated QA test run for your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="appName">App Name</Label>
            <Input
              id="appName"
              placeholder="My E-commerce App"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
            />
          </div>

          {/* Repository URL */}
          <div className="space-y-2">
            <Label htmlFor="repoUrl">GitHub Repository URL</Label>
            <Input
              id="repoUrl"
              type="url"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>

          {/* Test Flow Selection */}
          <div className="space-y-3">
            <Label>Select Test Flows</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading test flows...</p>
            ) : testFlows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No test flows available</p>
            ) : (
              <div className="space-y-3">
                {testFlows.map((flow) => (
                  <div key={flow.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={flow.id}
                      checked={selectedFlows.includes(flow.id)}
                      onCheckedChange={() => toggleFlow(flow.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={flow.id}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {flow.name}
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {flow.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createRun.isPending || selectedFlows.length === 0}
            className="w-full"
          >
            {createRun.isPending ? 'Starting QA Run...' : 'Run QA Tests'}
          </Button>

          {/* Error Message */}
          {createRun.isError && (
            <p className="text-sm text-destructive">
              Failed to create QA run. Please try again.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

---

### Step 9: QA Run Stats Component (`src/components/QaRunStats.tsx`)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QaRunEntity } from '@/types';

interface QaRunStatsProps {
  qaRun: QaRunEntity;
}

export function QaRunStats({ qaRun }: QaRunStatsProps) {
  const successRate =
    qaRun.totalSteps > 0
      ? Math.round((qaRun.passedSteps / qaRun.totalSteps) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{qaRun.totalSteps}</div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-700">
            Passed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">
            {qaRun.passedSteps}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-700">
            Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-700">
            {qaRun.failedSteps}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-700">
            Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">
            {successRate}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 10: Video Player Component (`src/components/VideoPlayer.tsx`)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoPlayerProps {
  videoUrl: string;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Full Session Recording</CardTitle>
      </CardHeader>
      <CardContent>
        <video
          src={videoUrl}
          controls
          className="w-full rounded-lg border"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </CardContent>
    </Card>
  );
}
```

---

### Step 11: QA Run Timeline Component (`src/components/QaRunTimeline.tsx`)

```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Play } from 'lucide-react';
import type { TestStepEntity } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface QaRunTimelineProps {
  steps: TestStepEntity[];
}

export function QaRunTimeline({ steps }: QaRunTimelineProps) {
  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No test steps yet. Waiting for tests to start...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <Card
          key={step.id}
          className={cn(
            'transition-all',
            step.status === 'passed' && 'border-green-200 bg-green-50/30',
            step.status === 'failed' && 'border-red-200 bg-red-50/30',
            step.status === 'running' && 'border-blue-200 bg-blue-50/30'
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                {step.status === 'passed' && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                )}
                {step.status === 'failed' && (
                  <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                )}
                {step.status === 'running' && (
                  <Play className="w-6 h-6 text-blue-600 mt-0.5" />
                )}
                {step.status === 'pending' && (
                  <Clock className="w-6 h-6 text-gray-400 mt-0.5" />
                )}

                {/* Step Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">
                      Step {step.stepNumber}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {step.actionName}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {step.executedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Executed at {formatDate(step.executedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                variant={step.status === 'passed' ? 'default' : 'destructive'}
                className={cn(
                  step.status === 'passed' && 'bg-green-600',
                  step.status === 'running' && 'bg-blue-600',
                  step.status === 'pending' && 'bg-gray-400'
                )}
              >
                {step.status}
              </Badge>
            </div>
          </CardHeader>

          {/* Screenshot */}
          {step.screenshotBase64 && (
            <CardContent>
              <img
                src={`data:image/png;base64,${step.screenshotBase64}`}
                alt={`Screenshot for step ${step.stepNumber}`}
                className="w-full rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() =>
                  window.open(
                    `data:image/png;base64,${step.screenshotBase64}`,
                    '_blank'
                  )
                }
              />
            </CardContent>
          )}

          {/* Error Message */}
          {step.errorMessage && (
            <CardContent className="pt-0">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800 font-medium mb-1">Error:</p>
                <p className="text-sm text-red-700">{step.errorMessage}</p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
```

---

### Step 12: Home Page (`src/app/page.tsx`)

```typescript
'use client';

import { QaRunForm } from '@/components/QaRunForm';
import { useQuery } from '@tanstack/react-query';
import { qaRunApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function HomePage() {
  // Fetch recent QA runs
  const { data: qaRunsResponse } = useQuery({
    queryKey: ['qa-runs'],
    queryFn: qaRunApi.getAll,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const qaRuns = qaRunsResponse?.data || [];

  return (
    <div className="space-y-12">
      {/* Create QA Run Section */}
      <section>
        <QaRunForm />
      </section>

      {/* Recent QA Runs Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Recent QA Runs</h2>

        {qaRuns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No QA runs yet. Create your first QA run above!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {qaRuns.slice(0, 10).map((run) => (
              <Link key={run.id} href={`/qa-runs/${run.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{run.appName}</CardTitle>
                        <CardDescription className="mt-1">
                          {run.repoUrl} ({run.branch})
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>
                        {run.totalSteps} steps
                      </span>
                      <span className="text-green-600">
                        {run.passedSteps} passed
                      </span>
                      {run.failedSteps > 0 && (
                        <span className="text-red-600">
                          {run.failedSteps} failed
                        </span>
                      )}
                      <span className="ml-auto">
                        {formatDate(run.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

### Step 13: QA Run Detail Page (`src/app/qa-runs/[id]/page.tsx`)

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { qaRunApi } from '@/lib/api';
import { QaRunStats } from '@/components/QaRunStats';
import { QaRunTimeline } from '@/components/QaRunTimeline';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getStatusColor } from '@/lib/utils';
import type { Id } from '@/types';

export default function QaRunDetailPage({ params }: { params: { id: string } }) {
  const qaRunId = params.id as Id<'qaRun'>;

  // Poll for QA run updates
  const { data: qaRunResponse, isLoading, refetch } = useQuery({
    queryKey: ['qa-run', qaRunId],
    queryFn: () => qaRunApi.getById(qaRunId),
    refetchInterval: (data) => {
      // Stop polling if completed or failed
      const status = data?.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });

  // Poll for test steps
  const { data: stepsResponse } = useQuery({
    queryKey: ['qa-run-steps', qaRunId],
    queryFn: () => qaRunApi.getSteps(qaRunId),
    refetchInterval: (data) => {
      const status = qaRunResponse?.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });

  const qaRun = qaRunResponse?.data;
  const steps = stepsResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading QA run...</p>
        </div>
      </div>
    );
  }

  if (!qaRun) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">QA Run Not Found</h2>
        <Link href="/">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold">{qaRun.appName}</h1>
            <p className="text-muted-foreground mt-1">
              {qaRun.repoUrl} ({qaRun.branch})
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDate(qaRun.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(qaRun.status)} variant="outline">
              {qaRun.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={qaRun.status === 'completed' || qaRun.status === 'failed'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {qaRun.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
          <p className="text-sm text-red-700">{qaRun.errorMessage}</p>
        </div>
      )}

      {/* Statistics */}
      <QaRunStats qaRun={qaRun} />

      {/* Video Recording */}
      {qaRun.videoRecordingUrl && (
        <VideoPlayer videoUrl={qaRun.videoRecordingUrl} />
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Test Timeline</h2>
        <QaRunTimeline steps={steps} />
      </div>
    </div>
  );
}
```

---

### Step 14: Global Styles (`src/app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 🎯 Next Steps

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Navigate to http://localhost:3000
   - Test QA run creation
   - View real-time updates

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📚 Component Summary

| Component | Purpose |
|-----------|---------|
| `QaRunForm` | Create new QA runs with repo URL and test flow selection |
| `QaRunStats` | Display pass/fail statistics in card format |
| `QaRunTimeline` | Show step-by-step test execution with screenshots |
| `VideoPlayer` | Play full session recording video |
| `Home Page` | QA run creation form + recent runs list |
| `Detail Page` | QA run status, stats, video, and timeline |

---

## 🎨 Features Implemented

- Real-time status updates with polling
- Step-by-step timeline with screenshots
- Video session playback
- Pass/fail statistics
- Error handling and display
- Responsive design
- Loading states
- Dark mode support (via Tailwind)

---

**Built for Daytona Hacksprint 2025** | Frontend powered by **Next.js 15 + TanStack Query + shadcn/ui**
