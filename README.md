# Nindo - Online Exam & Learning Platform

A full-stack exam preparation and online testing platform built for coaching centers and educational institutions. Features AI-powered question extraction, real-time performance analytics, and an intelligent AI tutor.

## Features

### Student App
- **Mock Tests** - Browse, take timed MCQ tests, and review detailed results
- **Performance Analytics** - Subject-wise accuracy, performance trends, activity heatmap
- **Leaderboard** - Global and batch-wise rankings
- **AI Tutor** - Context-aware chat assistant powered by Google Gemini for personalized study help
- **Study Materials** - Access notes and recorded video classes
- **Fee Management** - Track fee status

### Admin App
- **Question Management** - Create questions manually or extract from images/PDFs/Excel using AI
- **Test Management** - Create, schedule, and publish tests with configurable duration, marks, and negative marking
- **Student & Batch Management** - Organize students into batches with referral codes
- **Notes & Classes** - Upload study materials and recorded video lectures
- **Analytics Dashboard** - Platform metrics, top students, content distribution

## Tech Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Database**: Convex (real-time serverless database)
- **Auth**: Clerk (separate apps for student and admin)
- **AI**: Google Gemini via Vercel AI SDK
- **Styling**: Tailwind CSS with Radix UI components
- **Monorepo**: Turborepo with pnpm workspaces
- **Charts**: Recharts

## Project Structure

```
apps/
  student/          # Student-facing Next.js app (port 3000)
  admin/            # Admin/teacher Next.js app (port 3001)
packages/
  database/         # Convex schema, queries, and mutations
  ui/               # Shared UI component library
  types/            # Shared TypeScript types
  config/           # Shared Tailwind and TypeScript configs
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 9.15+

### Installation

```bash
pnpm install
```

### Environment Variables

Create `.env.local` files in `apps/student` and `apps/admin` with:

```
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
GOOGLE_GENERATIVE_AI_API_KEY=<your-gemini-key>
```

### Development

```bash
pnpm dev
```

This starts both the student app (port 3000) and admin app (port 3001) concurrently.

### Build

```bash
pnpm build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
