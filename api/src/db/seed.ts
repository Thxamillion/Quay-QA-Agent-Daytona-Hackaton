import { db } from '@/lib/client';
import { testFlowsTable, type TestFlowEntity } from './testFlow.db';
import { generateId } from '@/types';

async function seed() {
  console.log('Seeding database...');

  const flows = [
    {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      name: 'Login Flow',
      description: 'Test user login functionality',
      isDemo: 1,
      task: `
Go to http://localhost:3000/login
Find the email input field and enter "test@example.com"
Find the password input field and enter "password123"
Click the login or submit button
Wait for the page to load
Verify that you are now on a dashboard or home page (not the login page)
Extract any welcome message or user information visible on the page
      `.trim(),
    },
    {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      name: 'Navigation Flow',
      description: 'Test main navigation links',
      isDemo: 1,
      task: `
Go to http://localhost:3000
Click on the "Products" navigation link
Wait for the products page to load
Verify that product listings are visible
Click on the "About" navigation link
Wait for the about page to load
Verify that about content is visible
Extract the page title and main heading
      `.trim(),
    },
    {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      name: 'Form Submission Flow',
      description: 'Test contact form submission',
      isDemo: 1,
      task: `
Go to http://localhost:3000/contact
Find and fill in the name field with "John Doe"
Find and fill in the email field with "john@example.com"
Find and fill in the message textarea with "This is a test message"
Click the submit button
Wait for form submission
Verify that a success message appears
Extract the success message text
      `.trim(),
    },
  ];

  for (const flow of flows) {
    await db.insert(testFlowsTable).values(flow);
  }

  console.log(`✅ Seeded ${flows.length} test flows`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
