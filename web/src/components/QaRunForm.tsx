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
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* App Name and Branch Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="appName" className="text-sm font-medium text-foreground">App Name</Label>
            <Input
              id="appName"
              placeholder="Enter application name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="branch" className="text-sm font-medium text-foreground">Branch</Label>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
            />
          </div>
        </div>

        {/* Repository URL */}
        <div className="space-y-3">
          <Label htmlFor="repoUrl" className="text-sm font-medium text-foreground">GitHub Repository URL</Label>
          <Input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
            className="bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
          />
        </div>

        {/* Test Flow Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Select Test Flows</Label>
          {isLoading ? (
            <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading test flows...</p>
            </div>
          ) : testFlows.length === 0 ? (
            <div className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center">
              <p className="text-sm text-muted-foreground">No test flows available.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-6 space-y-4 bg-card/50">
              {testFlows.map((flow) => (
                <div key={flow.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={flow.id}
                    checked={selectedFlows.includes(flow.id)}
                    onCheckedChange={() => toggleFlow(flow.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={flow.id}
                      className="text-sm font-medium leading-none cursor-pointer text-foreground"
                    >
                      {flow.name}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1.5">
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
          className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
        >
          {createRun.isPending ? 'Starting QA Run...' : 'Run QA Tests'}
        </Button>

        {/* Error Message */}
        {createRun.isError && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <p className="text-sm text-destructive">
              Failed to create QA run. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
