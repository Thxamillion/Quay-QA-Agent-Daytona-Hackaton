import { Daytona } from '@daytonaio/sdk';
import { env } from './env';

export const daytona = new Daytona({
  apiKey: env.DAYTONA_API_KEY,
  apiUrl: env.DAYTONA_API_URL,
});
