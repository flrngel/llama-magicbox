# 📦 MagicBox - No-Code AI Document Processing Tool

> **Turn your expertise into AI models. No coding required.**

MagicBox is a no-code platform where domain experts can create AI solutions that process documents instantly. Train AI through natural conversation and share your expertise with the world. Built for the Llama 4 Impact Hackathon Seattle 2025.

## 🎯 The Problem We Solve

Every day, professionals struggle with repetitive document processing:
- **Tax professionals** manually categorize hundreds of receipts
- **HR managers** extract data from countless resumes  
- **Legal teams** review contracts for key terms
- **Healthcare workers** process insurance forms

Traditional solutions require expensive developers or generic AI tools that don't understand domain-specific needs.

## 💡 Our Solution

MagicBox empowers experts to create custom AI solutions through:

### 🎨 No-Code AI Creation
- **Conversational Training** - Teach AI by chatting, no programming needed
- **Visual Interface** - Drag, drop, and approve training examples
- **Instant Testing** - See results immediately and refine on the fly

### 📄 Universal Document Support
- **40+ file formats**: PDF, Word, Excel, PowerPoint, Images, Audio, ZIP archives
- **30MB file limit** per document
- **Batch processing**: Upload multiple files at once
- Powered by Microsoft's MarkItDown for universal conversion

### 🤖 Intelligent Processing
- **Llama 4 API** for advanced document understanding
- **Dynamic schemas** generated from natural language descriptions
- **Real-time refinement** through conversational feedback
- **Structured output** in clean, exportable formats

## 🚀 Key Features

### For Solution Creators
1. **Define Your Expertise** - Name your solution and describe what it does
2. **Train with Examples** - Upload 2-5 sample documents
3. **Refine Through Chat** - Tell the AI what to focus on
4. **Test & Validate** - Ensure accuracy before publishing
5. **Share Your Knowledge** - Make your solution available to others

### For Solution Users
- **Browse Solutions** - Find AI models created by experts
- **Instant Processing** - Upload documents and get results in seconds
- **Clean Output** - View data in tables or export to Excel/CSV
- **Rate & Review** - Provide feedback to improve solutions

## 🛠️ Technical Stack

### Frontend
- **Next.js 15** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern utility-first styling
- **shadcn/ui** - Beautiful, accessible components

### Backend
- **SQLite** - Lightweight persistent storage with migrations
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
│   │   ├── (landing)/         # Public solution gallery
│   │   ├── create/            # 4-step solution creation
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

# Start development server
yarn dev
```

### Environment Variables

```env
LLAMA_API_KEY=your_llama_api_key_here
```

## 🎮 Demo Walkthrough

### Creating a Solution

1. **Click "Create Solution"** from the homepage
2. **Define Your Solution** (Step 1):
   - Name: "Smart Tax Receipt Organizer"
   - Description: What your AI will do
   - Output structure: What data to extract
3. **Train Your AI** (Step 2):
   - Upload 2-5 example documents
   - Chat with AI to improve understanding
   - Approve or refine each training example
4. **Test Your Solution** (Step 3):
   - Upload a test document
   - Verify AI extracts data correctly
5. **Publish** (Step 4):
   - Give your solution a unique URL
   - Add detailed description
   - Choose a category

### Using a Solution

1. **Browse** available solutions
2. **Select** one that fits your needs
3. **Upload** your documents (any format)
4. **Get results** instantly in structured format
5. **Export** data or copy to clipboard

## 🏆 Why MagicBox Wins

1. **True No-Code** - Anyone can create AI solutions without programming
2. **Domain Expertise** - Solutions built by professionals who understand the field
3. **Instant Value** - Process documents in seconds, not hours
4. **Universal Support** - Works with virtually any document format
5. **Conversational Training** - Natural way to teach AI

## 🎯 Use Cases

### Tax & Accounting
- Receipt categorization
- Expense report processing
- Invoice data extraction

### Human Resources
- Resume parsing
- Application screening
- Benefits enrollment processing

### Legal
- Contract review
- Compliance checking
- Legal document summarization

### Healthcare
- Insurance form processing
- Medical record extraction
- Patient intake automation

## 🎯 Hackathon Alignment

### Llama 4 Integration
- Leverages Llama 4's advanced language understanding
- Uses conversational capabilities for intuitive training
- Dynamic prompt engineering for accuracy

### Impact Categories
- **⚡ Efficiency** - Reduces document processing from hours to seconds
- **🌍 Accessibility** - Makes AI accessible to non-technical experts
- **💡 Innovation** - First truly no-code AI training platform
- **📚 Knowledge Sharing** - Democratizes expertise across domains

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**🌟 Ready to turn your expertise into AI?**

Visit [MagicBox Demo](#) | [Video Demo](#) | [Pitch Deck](pitch.md)