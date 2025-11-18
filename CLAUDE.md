# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QA Automation Agent** - AI-powered end-to-end testing system using Daytona workspaces and browser-use (Python) to visually test web applications. Built for Daytona Hacksprint 2025.

The system spins up applications in Daytona workspaces, runs automated browser tests using AI agents, and provides step-by-step visual results with screenshots and full session video recordings.

## Repository Structure

```
daytona/
├── api/          # Backend (Bun + Elysia + TypeScript)
├── web/          # Frontend (Next.js 15 + React)
├── backend.md    # Detailed backend implementation guide
├── frontend.md   # Detailed frontend implementation guide
└── QA_AGENT_FINAL_PLAN.md  # Complete architecture plan
```

## Technology Stack

### Backend (`api/`)
- **Runtime**: Bun (NOT Node.js - always use `bun` commands)
- **Framework**: Elysia (lightweight TypeScript REST API)
- **Database**: PostgreSQL + Drizzle ORM
- **Background Jobs**: Inngest (durable execution)
- **Workspace Control**: Daytona SDK
- **Testing Engine**: browser-use (Python) - called via generated scripts in Daytona workspaces

### Frontend (`web/`)
- **Framework**: Next.js 15 (App Router)
- **State Management**: TanStack Query
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Language**: TypeScript

## Development Commands

### Backend (api/)
```bash
cd api

# Install dependencies (use Bun, not npm)
bun install

# Database operations
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:seed      # Seed demo test flows

# Development
bun run dev          # Start with hot reload
bun run start        # Production mode

# Running individual files
bun <file.ts>        # Execute TypeScript directly
bun test             # Run tests
```

### Frontend (web/)
```bash
cd web

# Install dependencies
npm install

# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code
```

### Running Both Services
Backend runs on port 3001, frontend on port 3000. Start backend first, then frontend.

## Architecture Overview

### Request Flow
1. **Frontend** → User creates QA run with GitHub repo URL and test flows
2. **Backend API** → Creates QA run entity, triggers Inngest background job
3. **Inngest Job** → Orchestrates multi-step workflow:
   - Creates Daytona workspace
   - Clones repo and starts dev server (e.g., `npm run dev`)
   - Installs browser-use (Python) in workspace
   - Generates Python test scripts from test flow definitions
   - Executes tests using browser-use agent
   - Collects screenshots and video recording
   - Saves results to database
4. **Frontend** → Polls for updates, displays timeline with screenshots and video

### Key Components

**Backend Services** (`api/src/service/`):
- `workspace/Workspace.service.ts` - Daytona workspace operations (create, setup app, install browser-use)
- `qaRun/QaRun.service.ts` - QA run CRUD, test execution, result parsing
- `qaRun/QaRun.jobs.ts` - Inngest background job workflow
- `qaRun/QaRun.python.ts` - Generates Python scripts for browser-use
- `testFlow/TestFlow.service.ts` - Test flow management

**Database Schemas** (`api/src/db/`):
- `qaRun.db.ts` - QA run entity (status, results, video URL)
- `testFlow.db.ts` - Test flow entity (natural language test descriptions)
- `testStep.db.ts` - Individual test steps (with screenshots)

**Frontend Components** (`web/src/components/`):
- `QaRunForm.tsx` - Create new QA runs
- `QaRunTimeline.tsx` - Step-by-step results with screenshots
- `QaRunStats.tsx` - Pass/fail statistics
- `VideoPlayer.tsx` - Full session recording viewer

## Environment Variables

### Backend (`api/.env`)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/qa_agent
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_API_URL=https://api.daytona.io
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
PORT=3001
```

### Frontend (`web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Important Implementation Details

### Bun-Specific Patterns (from api/CLAUDE.md)
- **Always use Bun APIs**: Use `Bun.file`, `Bun.$`, etc. instead of Node.js equivalents
- **No dotenv needed**: Bun automatically loads `.env` files
- **Built-in SQLite**: Use `bun:sqlite` instead of `better-sqlite3`
- **Native fetch**: Use built-in fetch, no need for external libraries

### Test Flow System
Test flows use natural language task descriptions for browser-use agents:
```typescript
{
  name: "Login Flow",
  task: `
    Go to http://localhost:3000/login
    Find the email input field and enter "test@example.com"
    Find the password input field and enter "password123"
    Click the login button
    Verify you are on the dashboard
    Extract any welcome message
  `
}
```

### Python Script Generation
The backend generates Python scripts dynamically using browser-use:
- Scripts run in Daytona workspaces
- Auto-capture screenshots per action
- Record full session video
- Return JSON results with base64 screenshots

### Real-time Updates
Frontend uses TanStack Query with polling:
- Poll every 3-5 seconds during test execution
- Stop polling when status is 'completed' or 'failed'
- Display updates in real-time timeline

## Database Schema Notes

### Status Flow
QA Run statuses: `pending` → `setting_up` → `running_tests` → `completed`/`failed`
Test Step statuses: `pending` → `running` → `passed`/`failed`

### Video Storage
- `videoRecordingPath`: Path in Daytona workspace (e.g., `/tmp/recordings/video.mp4`)
- `videoRecordingUrl`: Public URL after upload (implementation may vary)

### Screenshots
Stored as base64-encoded strings in `testStep.screenshotBase64` field

## API Endpoints

### Test Flows
- `GET /api/test-flow` - List all test flows
- `GET /api/test-flow/:id` - Get single test flow
- `POST /api/test-flow` - Create new test flow

### QA Runs
- `GET /api/qa-run` - List all QA runs
- `GET /api/qa-run/:id` - Get single QA run
- `GET /api/qa-run/:id/steps` - Get test steps for QA run
- `POST /api/qa-run` - Create and start new QA run

### Inngest
- `POST /api/inngest` - Inngest webhook endpoint

## Common Development Tasks

### Adding New Test Flow
1. Add to seed file (`api/src/db/seed.ts`) or create via API
2. Define natural language task description
3. Test with browser-use in Daytona workspace

### Debugging Failed Tests
1. Check QA run status and error message in database
2. Review test step screenshots to see where it failed
3. Watch full video recording if available
4. Check Inngest logs for job execution details

### Modifying Python Script Generation
Edit `api/src/service/qaRun/QaRun.python.ts` to change how browser-use scripts are generated

### Adding New API Endpoints
Add routes in `api/src/index.ts` using Elysia pattern

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running and `DATABASE_URL` is correct
- Run `bun run db:push` to ensure schema is up to date
- Check all environment variables are set

### Frontend can't connect to API
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is enabled in backend (already configured)

### Tests failing in Daytona workspace
- Verify app starts correctly (`npm run dev` in workspace)
- Check browser-use is installed (`pip install browser-use`)
- Review Python script in `/tmp/test_*.py` in workspace
- Check Chromium dependencies are available

## Reference Documentation

For detailed implementation guides, see:
- `backend.md` - Complete backend implementation with code examples
- `frontend.md` - Complete frontend implementation with code examples
- `QA_AGENT_FINAL_PLAN.md` - Full architecture and design decisions
- `api/CLAUDE.md` - Bun-specific development patterns
