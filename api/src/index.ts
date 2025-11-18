import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { env } from './lib/env';
import { QaRunService } from './service/qaRun/QaRun.service';
import { TestFlowService } from './service/testFlow/TestFlow.service';
import { serve } from 'inngest/bun';
import { runQaTestsJob } from './service/qaRun/QaRun.jobs';
import { inngestClient } from './lib/inngest-client';

const app = new Elysia()
  .use(cors())

  // Health check
  .get('/health', () => ({ status: 'ok' }))

  // Test Flows
  .get('/api/test-flow', async () => {
    const flows = await TestFlowService.getAll();
    return { success: true, data: flows };
  })

  .get('/api/test-flow/:id', async ({ params }) => {
    const flow = await TestFlowService.getById(params.id as any);
    if (!flow) {
      return { success: false, error: 'Test flow not found' };
    }
    return { success: true, data: flow };
  })

  .post('/api/test-flow', async ({ body }) => {
    const flow = await TestFlowService.create(body as any);
    return { success: true, data: flow };
  })

  // QA Runs
  .get('/api/qa-run', async () => {
    const runs = await QaRunService.getAll();
    return { success: true, data: runs };
  })

  .get('/api/qa-run/:id', async ({ params }) => {
    const run = await QaRunService.getById(params.id as any);
    if (!run) {
      return { success: false, error: 'QA run not found' };
    }
    return { success: true, data: run };
  })

  .get('/api/qa-run/:id/steps', async ({ params }) => {
    const steps = await QaRunService.getSteps(params.id as any);
    return { success: true, data: steps };
  })

  .post('/api/qa-run', async ({ body }) => {
    const run = await QaRunService.create(body as any);
    return { success: true, data: run };
  })

  // Inngest endpoint
  .all('/api/inngest', async ({ request }) => {
    const handler = serve({
      client: inngestClient,
      functions: [runQaTestsJob],
    });
    return handler(request);
  })

  .listen(env.PORT);

console.log(`🚀 Backend running at http://localhost:${env.PORT}`);
