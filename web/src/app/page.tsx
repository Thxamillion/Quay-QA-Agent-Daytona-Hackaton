'use client';

import { QaRunForm } from '@/components/QaRunForm';
import { useQuery } from '@tanstack/react-query';
import { qaRunApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, getStatusColor } from '@/lib/utils';
import { FlaskConical } from 'lucide-react';

export default function HomePage() {
  // Fetch recent QA runs
  const { data: qaRunsResponse } = useQuery({
    queryKey: ['qa-runs'],
    queryFn: qaRunApi.getAll,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const qaRuns = qaRunsResponse?.data || [];

  return (
    <div className="space-y-16">
      {/* Create QA Run Section */}
      <section>
        <h1 className="text-5xl font-bold mb-10 text-foreground">Create New QA Test Run</h1>
        <QaRunForm />
      </section>

      {/* Recent QA Runs Section */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-foreground">Recent QA Runs</h2>

        {qaRuns.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-card/50">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FlaskConical className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No QA runs yet</h3>
                  <p className="text-sm text-muted-foreground">Create your first QA run above!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {qaRuns
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((run) => (
              <Link key={run.id} href={`/qa-runs/${run.id}`}>
                <Card className="hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="group-hover:text-primary transition-colors">{run.appName}</CardTitle>
                        <CardDescription className="mt-1.5">
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
                      <span className="text-green-400">
                        {run.passedSteps} passed
                      </span>
                      {run.failedSteps > 0 && (
                        <span className="text-red-400">
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
