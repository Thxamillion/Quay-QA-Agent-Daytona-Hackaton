import { Inngest } from 'inngest';
import { env } from './env';

export const inngestClient = new Inngest({
  id: 'qa-automation-agent',
  eventKey: env.INNGEST_EVENT_KEY,
});
