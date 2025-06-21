# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start development server with Turbopack on port 9002
- `yarn build` - Build the Next.js application for production
- `yarn start` - Start production server
- `yarn lint` - Run Next.js linting
- `yarn typecheck` - Run TypeScript type checking
- `yarn genkit:dev` - Start Genkit development server for AI flows
- `yarn genkit:watch` - Start Genkit with file watching for AI flows

## Project Architecture

MagicBox is a crowdsourced AI platform where creators train specialized document processing solutions that users can instantly access. Think "Airbnb for life solutions" - democratizing expertise while creating new income streams.

### Core Concept (from idea.md)

**Two-Sided Marketplace:**
- **CREATORS**: Experts who train AI solutions with their knowledge (tax pros, property managers, healthcare advocates)
- **USERS**: Regular people who need expert-level document processing instantly

**Revenue Model**: Creators earn 70% when their solutions are used, platform takes 30%

### Application Structure

**Core Pages:**
- `/` - Landing/Marketplace (unified marketplace with search/filter functionality)
- `/create` - Creator Studio (4-step solution training process, requires authentication)
- `/use/[slug]` - Solution Processor (instant document processing)

**Note**: The `/browse` route was removed and functionality merged into the landing page for a simplified user experience.

**3 Core Components:**
- `FileUploader` - Drag/drop with preview
- `ChatTrainer` - Conversational AI training interface
- `ResultsViewer` - Structured output display with export options

### Technical Stack

- **Frontend**: Next.js 15 with TypeScript, App Router
- **AI Integration**: Llama API client with Llama 3.2 models
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Data Layer**: Mock data system (ready for database integration)

### AI Flows

AI flows use Llama API client and handle document processing:
- `generate-output-schema.ts` - Generates Zod schemas from natural language descriptions
- `process-document-flow.ts` - Processes documents based on dynamic instructions and output schemas
- `refine-solution-flow.ts` - Refines and improves existing solutions based on user feedback

Each flow follows the pattern:
1. Define TypeScript interfaces for input/output
2. Create comprehensive prompts for Llama models
3. Handle API calls with error handling and fallbacks

### Data Models

The main data model is the `Solution` interface in `src/lib/data.ts`:
- Contains metadata, usage stats, and example outputs
- Categories include Tax & Finance, Medical & Insurance, Rental & Legal, Personal Organization
- Mock data generates random usernames for solution creators

### Creator Flow (4 Steps per PM Blueprint)

1. **Problem Definition**: Solution name, description, target users
2. **Document Training**: File upload + conversational AI training
3. **Testing**: Upload test document, validate AI processing
4. **Publishing**: Generate shareable URL, go live

### User Authentication Strategy

**Current Implementation:**
- **Authentication Context**: React Context API (`/src/lib/auth.tsx`) with localStorage persistence
- **Login Modal**: Tabbed interface (`/src/components/login-modal.tsx`) with login/signup forms and demo account
- **Protected Routes**: `/create` page requires authentication with loading states
- **Header Integration**: Shows user avatar/dropdown when authenticated, login button when not

**User Access:**
- **Guest Users**: Can browse marketplace and use solutions
- **Logged-in Users**: Can create solutions, with persistent login state
- **Demo Account**: Available for quick testing (demo@example.com / password)

**Authentication Flow:**
- Login required for: creating solutions
- Mock authentication system ready for backend integration
- Persistent sessions via localStorage

### Key UI Components

- `FileUploader`: Drag/drop interface with file validation, preview thumbnails, and progress tracking
- `ChatTrainer`: Conversational AI training interface with message history and real-time responses
- `ResultsViewer`: Structured output display with export functionality
- `SolutionCard`: Marketplace solution display with usage stats and ratings
- `Header`: Navigation with user authentication state, shows user avatar when logged in
- `Footer`: Site footer component
- `LoginModal`: Authentication modal with login/signup tabs and demo account access

### Authentication Components

- `AuthProvider`: React Context provider for authentication state management
- `LoginModal`: Modal component with tabbed login/signup interface
- Protected page components with authentication guards and loading states

## Development Notes

- **AI Integration**: Requires `LLAMA_API_KEY` environment variable (see `.env.example`)
- **Authentication**: React Context system ready for backend integration
- **Export functionality**: Planned for CSV, PDF, and JSON formats
- **Styling**: shadcn/ui patterns with Tailwind utility classes
- **TypeScript**: Strictly enforced with `yarn typecheck`
- **SSR**: Hydration issues resolved with deterministic data generation
- **Navigation**: Unified marketplace experience on landing page

## Recent Changes

- **AI Provider Migration**: Switched from Google Genkit to Llama API client for better reliability
- **Simplified AI Flows**: Replaced complex Genkit flows with direct Llama API calls
- **Authentication System**: Full implementation with React Context, login modal, and protected routes
- **Route Consolidation**: Merged `/browse` functionality into landing page (`/`)
- **UI Simplification**: Removed hero/featured sections, focused on marketplace functionality
- **Hydration Fixes**: Replaced random username generation with static deterministic usernames
- **Fixed "Next: Train AI" Button**: Resolved API integration issues and form validation