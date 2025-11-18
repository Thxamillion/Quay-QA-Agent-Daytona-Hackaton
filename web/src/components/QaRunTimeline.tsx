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
