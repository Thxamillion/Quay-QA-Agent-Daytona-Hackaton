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
