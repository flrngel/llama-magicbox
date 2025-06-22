# 📦 MagicBox - AI Marketplace for Document Processing

> **Turn expertise into income. Process documents instantly.**

MagicBox is a two-sided marketplace where domain experts create AI solutions that process documents, and users get instant, affordable document processing. Built for the Llama 4 Impact Hackathon Seattle 2025.

## 🎯 The Problem We Solve

Every day, millions struggle with document processing:
- **Small businesses** drown in receipts during tax season
- **Patients** can't understand medical insurance claims  
- **Landlords** manually extract data from rental applications
- **Everyone** pays $200+/hour for simple document tasks

## 💡 Our Solution

MagicBox creates a win-win marketplace:

### For Experts (Creators)
- **Monetize your knowledge** - Turn expertise into passive income
- **No coding required** - Train AI through natural conversation
- **Earn while you sleep** - 70% revenue share on every use

### For Users
- **Instant processing** - Upload any document, get structured data in seconds
- **Affordable** - Pay $3-5 per use instead of hourly consulting fees
- **Expert-quality** - AI trained by actual professionals in the field

## 🚀 Key Features

### 🎨 No-Code AI Creation
1. **Define** your solution (name, description, target users)
2. **Upload** 2-5 example documents
3. **Train** AI through conversational interface
4. **Publish** to marketplace in minutes

### 📄 Universal Document Support
- **40+ file formats**: PDF, Word, Excel, PowerPoint, Images, Audio, ZIP archives
- **30MB file limit** per document
- **Batch processing**: Upload multiple files at once
- Powered by Microsoft's MarkItDown for universal conversion

### 🤖 Intelligent Processing
- **Llama 4 API** for advanced document understanding
- **Dynamic output schemas** generated from natural language
- **Conversational refinement** to improve accuracy
- **Real-time processing** with instant results

### 💰 Marketplace Features
- **Browse & search** solutions by category
- **Ratings & reviews** from verified users
- **Usage tracking** and analytics
- **Secure payments** (payment integration ready)

## 🛠️ Technical Stack

### Frontend
- **Next.js 15** - Full-stack React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern utility-first styling
- **shadcn/ui** - Beautiful, accessible components

### Backend
- **SQLite** - Persistent data storage with migrations
- **Server Actions** - Type-safe API layer
- **Python Integration** - Isolated environments for document processing

### AI/ML
- **Llama 4 API** - Latest language models for document understanding
- **MarkItDown** - Microsoft's universal document converter
- **Dynamic Schemas** - Zod schemas generated from descriptions

### Infrastructure
- **Vercel-ready** - Optimized for edge deployment
- **File Processing** - Secure temporary file handling
- **Real-time Updates** - Optimistic UI with server synchronization

## 📁 Project Structure

```
magicbox/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (landing)/         # Public marketplace
│   │   ├── create/            # Solution creation flow
│   │   ├── use/[slug]/        # Solution usage pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── training-studio/  # AI training interface
│   │   └── results-viewer/   # Output display
│   ├── lib/                   # Core utilities
│   │   ├── database.ts       # SQLite integration
│   │   ├── auth.tsx          # Authentication context
│   │   └── markitdown/       # Document processing
│   └── ai/                    # AI workflows
│       └── flows/            # Llama integration
├── public/                    # Static assets
├── scripts/                   # Build & utility scripts
└── magicbox.db               # SQLite database
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+ (for MarkItDown)
- Llama API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/magicbox.git
cd magicbox

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Add your LLAMA_API_KEY to .env.local

# Initialize database
yarn db:seed

# Start development server
yarn dev
```

### Environment Variables

```env
LLAMA_API_KEY=your_llama_api_key_here
```

## 🎮 Demo Walkthrough

### Creating a Solution (Expert Flow)

1. **Sign in** and click "Create Solution"
2. **Define** your solution:
   - Name: "Smart Tax Receipt Organizer"
   - Description: Process receipts for tax filing
   - Target users: Small business owners
3. **Train** your AI:
   - Upload 2-5 example receipts
   - Chat with AI to refine understanding
   - Approve training examples
4. **Test** with new documents
5. **Publish** to marketplace

### Using a Solution (User Flow)

1. **Browse** marketplace or search
2. **Select** a solution (e.g., "Tax Receipt Organizer")
3. **Upload** your documents (any format)
4. **Get results** instantly in structured format
5. **Export** to Excel/CSV or copy data

## 📊 Business Model

- **Transaction fees**: 30% platform fee on each use
- **Creator earnings**: 70% revenue share
- **Typical pricing**: $3-10 per document processed
- **Scale potential**: Thousands of creators × thousands of users

## 🏆 Why MagicBox Wins

1. **Network Effects** - More creators → better solutions → more users → more creators
2. **No Competition** - First marketplace for AI document processing solutions
3. **Real Expertise** - Solutions by professionals, not generic AI
4. **Instant Value** - Users see ROI immediately ($3 vs $200/hour)
5. **Technical Moat** - Advanced document processing pipeline

## 🎯 Hackathon Alignment

### Llama 4 Integration
- Uses latest Llama 4 API for document understanding
- Leverages conversational capabilities for training
- Dynamic prompt engineering for accuracy

### Impact Categories
- **💼 Economic** - Democratizes access to professional expertise
- **🌍 Social** - Makes document processing affordable for everyone
- **💰 Financial** - Creates new income streams for experts
- **⚡ Efficiency** - Reduces hours of work to seconds

## 🤝 Team

Built with ❤️ for the Llama 4 Impact Hackathon Seattle 2025

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**🌟 Ready to revolutionize document processing?**

Visit [MagicBox Demo](#) | [Video Demo](#) | [Pitch Deck](pitch.md)