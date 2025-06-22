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
- **Database**: SQLite with better-sqlite3 for persistent data storage
- **Data Layer**: Full database integration with API routes

### AI Flows

AI flows use Llama API client and handle document processing:
- `generate-output-schema.ts` - Generates Zod schemas from natural language descriptions
- `process-document-flow.ts` - Processes documents based on dynamic instructions and output schemas
- `refine-solution-flow.ts` - Refines and improves existing solutions based on user feedback

Each flow follows the pattern:
1. Define TypeScript interfaces for input/output
2. Create comprehensive prompts for Llama models
3. Handle API calls with error handling and fallbacks

### Database Architecture

**Database System**: SQLite with better-sqlite3 driver
- **Location**: `magicbox.db` in project root
- **Schema**: Relational database with users, solutions, and data_items tables
- **Migration Support**: Automatic schema updates and data migration
- **Seeding**: Default data with sample solutions and users

**Database Tables:**
- `users` - User accounts with id, name, email, avatar
- `solutions` - AI solutions with metadata, status (draft/published), and training data
- `data_items` - Training examples linked to solutions with file content and AI outputs
- `ratings` - User ratings and feedback for solutions (1-5 stars with optional comments)

**Key Features:**
- Draft solution support for creator workflow
- Automatic foreign key constraints and indexing
- Migration system for schema updates
- Deterministic seeding for consistent development data

### API Layer

**API Routes** (`/src/app/api/`):
- `GET /api/solutions` - Fetch all published solutions
- `POST /api/solutions` - Create new solution with training data
- `GET /api/solutions/[id]` - Fetch solution by ID
- `GET /api/solutions/my?creatorId=X` - Fetch solutions by creator
- `GET /api/solutions/slug/[slug]` - Fetch solution by slug
- `GET /api/ratings/[solutionId]` - Fetch ratings and comments for a solution

**Data Operations** (`/src/lib/db-operations.ts`):
- User CRUD operations with email uniqueness
- Solution lifecycle management (draft → published)
- Training data item management
- Complex operations like `publishSolutionWithDataItems`

**Client Layer** (`/src/lib/data-client.ts`):
- Type-safe API client functions
- Error handling and response parsing
- Clean separation between server and client data access

### Data Models

**Core Interfaces** (`src/lib/data.ts`):
- `Solution` - Complete solution with metadata, training data, and status
- `DataItem` - Training examples with file content and model outputs
- `User` - User accounts with authentication data
- `Rating` - User ratings with stars (1-5) and optional feedback comments

**Solution Lifecycle:**
- Draft solutions for creator workflow
- Published solutions visible in marketplace
- Status transitions managed through database operations

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
- **Logged-in Users**: Can create solutions and rate solutions, with persistent login state
- **Demo Account**: Available for quick testing (demo@example.com / password)

**Authentication Flow:**
- Login required for: creating solutions, rating solutions
- Mock authentication system ready for backend integration
- Persistent sessions via localStorage

### Rating System

**Features:**
- **5-Star Rating**: Simple 1-5 star rating system with descriptive labels
- **Optional Comments**: Users can provide detailed feedback (max 500 characters)
- **One Rating Per User**: Users can update their rating but only have one per solution
- **Real-time Updates**: Solution average ratings update immediately
- **Rating Statistics**: Track rating distribution and calculate averages
- **Interactive Stats Display**: Clickable rating stats show detailed modal with all reviews
- **Anonymous Reviews**: Generated usernames protect user identity while showing feedback
- **Rating Distribution**: Visual breakdown of 1-5 star ratings with progress bars
- **Creator Insights**: Solution creators can see rating breakdowns and feedback

**Rating Policy:**
- Only authenticated users can rate solutions
- Must successfully process documents to access rating
- Users cannot rate their own solutions
- Ratings are anonymous to solution creators with generated usernames
- Comments are filtered for spam and inappropriate content
- Users can view detailed ratings and statistics for any solution

**Database Integration:**
- Ratings stored in dedicated `ratings` table
- Automatic average calculation and solution rating updates
- Unique constraint prevents duplicate ratings per user/solution
- Soft validation with CHECK constraints for rating values (1-5)

### Key UI Components

- `FileUploader`: Drag/drop interface with file validation, preview thumbnails, and progress tracking
- `ChatTrainer`: Conversational AI training interface with message history and real-time responses
- `ResultsViewer`: Structured output display with clean table formatting and optional raw JSON view
- `SolutionCard`: Marketplace solution display with usage stats and ratings
- `SolutionRating`: 5-star rating component with optional comments for solution feedback
- `RatingStats`: Interactive rating statistics display with clickable modal for detailed reviews
- `RatingsModal`: Detailed view of all ratings with user feedback, rating distribution, and statistics
- `Header`: Navigation with user authentication state, shows user avatar when logged in
- `Footer`: Site footer component
- `LoginModal`: Authentication modal with login/signup tabs and demo account access

### Authentication Components

- `AuthProvider`: React Context provider for authentication state management
- `LoginModal`: Modal component with tabbed login/signup interface
- Protected page components with authentication guards and loading states

## Development Notes

- **AI Integration**: Requires `LLAMA_API_KEY` environment variable (see `.env.example`)
- **Database**: SQLite database with automatic initialization and migrations
- **Authentication**: React Context system ready for backend integration
- **Export functionality**: Planned for CSV, PDF, and JSON formats
- **Styling**: shadcn/ui patterns with Tailwind utility classes
- **TypeScript**: Strictly enforced with `yarn typecheck`
- **SSR**: Hydration issues resolved with deterministic data generation
- **Navigation**: Unified marketplace experience on landing page

## Recent Changes

- **AI Provider Migration**: Switched from Google Genkit to Llama API client for better reliability
- **Simplified AI Flows**: Replaced complex Genkit flows with direct Llama API calls
- **Database Integration**: Complete SQLite implementation with better-sqlite3
- **API Layer**: RESTful API routes for all data operations
- **Data Persistence**: Full replacement of mock data with database storage
- **Authentication System**: Full implementation with React Context, login modal, and protected routes
- **Route Consolidation**: Merged `/browse` functionality into landing page (`/`)
- **UI Simplification**: Removed hero/featured sections, focused on marketplace functionality
- **Hydration Fixes**: Replaced random username generation with static deterministic usernames
- **Fixed "Next: Train AI" Button**: Resolved API integration issues and form validation
- **Solution Drafts**: Added draft/published status workflow for creators
- **Rating System**: Complete 5-star rating system with comments and database integration
- **ResultsViewer Enhancement**: Clean table-only view with formatted/raw JSON tabs
- **Multiple File Support**: Parallel document processing with individual result views
- **Markitdown Integration**: Universal document processing for 40+ file formats with 30MB file size limit