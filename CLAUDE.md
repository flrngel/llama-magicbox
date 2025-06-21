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

**3 Core Pages:**
- `/` - Landing/Marketplace (browse solutions + social proof)
- `/create` - Creator Studio (4-step solution training process)
- `/use/[slug]` - Solution Processor (instant document processing)

**3 Core Components:**
- `FileUploader` - Drag/drop with preview
- `ChatTrainer` - Conversational AI training interface
- `ResultsViewer` - Structured output display with export options

### Technical Stack

- **Frontend**: Next.js 15 with TypeScript, App Router
- **AI Integration**: Google Genkit with Gemini 1.5 Flash
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Data Layer**: Mock data system (ready for database integration)

### AI Flows

AI flows are defined using Google Genkit and handle document processing:
- `extract-application-data.ts` - Extracts structured data from rental applications
- `categorize-receipts.ts` - Categorizes business receipts for tax purposes  
- `refine-solution-flow.ts` - Refines and improves existing solutions

Each flow follows the pattern:
1. Define input/output schemas with Zod
2. Create a prompt template with AI context
3. Define the flow logic using Genkit's `defineFlow`

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

- **Guest Users**: Can browse and use solutions, temporary results
- **Logged-in Users**: Can create solutions, save results, rate solutions
- Login required for: creating solutions, rating, permanent result storage
- Optional login prompts after successful usage

### Key UI Components

- `FileUploader`: Drag/drop interface with file validation, preview thumbnails, and progress tracking
- `ChatTrainer`: Conversational AI training interface with message history and real-time responses
- `ResultsViewer`: Structured output display with export functionality
- `SolutionCard`: Marketplace solution display with usage stats and ratings
- `Header`: Navigation with branding and action buttons
- `Footer`: Site footer component

## Development Notes

- AI flows require Google AI API configuration via environment variables
- Authentication system ready for OAuth integration (Google, email/password)
- Export functionality planned for CSV, PDF, and JSON formats
- Component styling follows shadcn/ui patterns with Tailwind utility classes
- TypeScript is strictly enforced with `yarn typecheck`