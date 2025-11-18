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
