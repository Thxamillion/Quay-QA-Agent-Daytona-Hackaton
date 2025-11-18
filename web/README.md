# QA Automation Agent - Frontend

> Next.js 15 + TanStack Query + shadcn/ui

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Backend API running on `http://localhost:3001`

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with header/footer
│   ├── page.tsx            # Home page (create QA run + recent runs)
│   ├── qa-runs/
│   │   └── [id]/
│   │       └── page.tsx    # QA run detail page
│   └── globals.css         # Global styles
│
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── checkbox.tsx
│   │   ├── label.tsx
│   │   └── badge.tsx
│   │
│   ├── QaRunForm.tsx       # Create QA run form
│   ├── QaRunStats.tsx      # Pass/fail statistics cards
│   ├── QaRunTimeline.tsx   # Step-by-step timeline with screenshots
│   ├── VideoPlayer.tsx     # Full session video player
│   └── Providers.tsx       # QueryClientProvider wrapper
│
├── lib/                    # Utilities
│   ├── api.ts              # API client functions
│   ├── utils.ts            # Utility functions
│   └── query-client.ts     # TanStack Query setup
│
└── types/                  # TypeScript types
    └── index.ts            # Shared types (matching backend)
```

## Features

- **QA Run Creation**: Form to create new QA test runs with repository URL and test flow selection
- **Real-time Updates**: Automatic polling for status updates during test execution
- **Visual Timeline**: Step-by-step results with screenshots for each action
- **Video Playback**: Full session recording viewer
- **Statistics Dashboard**: Pass/fail metrics and success rate
- **Recent Runs**: List of recent QA runs with status badges
- **Responsive Design**: Works on desktop and mobile devices

## API Integration

The frontend connects to the backend API at `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`).

### Endpoints Used

- `GET /api/test-flow` - Fetch available test flows
- `GET /api/qa-run` - Fetch all QA runs
- `GET /api/qa-run/:id` - Fetch single QA run
- `GET /api/qa-run/:id/steps` - Fetch test steps
- `POST /api/qa-run` - Create new QA run

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Development Notes

- All pages use client-side rendering (`'use client'`) for React Query hooks
- Polling intervals adjust based on QA run status (stop polling when completed/failed)
- Screenshots are displayed as base64-encoded images
- Video player uses native HTML5 video element

## Troubleshooting

**API connection errors:**
- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled on backend

**Build errors:**
- Clear `.next` directory and rebuild
- Verify all dependencies are installed
- Check TypeScript types match backend schema

## Next Steps

1. Start the backend API (see `../api/README.md`)
2. Start the frontend development server
3. Navigate to `http://localhost:3000`
4. Create your first QA run

---

**Built for Daytona Hacksprint 2025**
