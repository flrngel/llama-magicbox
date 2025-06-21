# **MagicBox: Engineering Blueprint**
*Clear specs for 24-hour hackathon build*

---

## 🎯 **Product Definition**
**What**: Platform where anyone can create AI document solutions by training with examples, and anyone can use these solutions instantly.

**Core Value**: Turn document expertise into shareable AI tools.

**Success Metric**: Create solution in 2 minutes, use solution in 30 seconds.

---

## 🏗️ **Application Architecture**

### **3 Core Pages**
1. **Landing/Marketplace** (`/`) - Browse solutions + login
2. **Creator** (`/create`) - Train AI solutions  
3. **Processor** (`/use/[id]`) - Use solutions

### **3 Core Components**
1. **FileUploader** - Drag/drop with preview
2. **ChatTrainer** - Conversational AI training
3. **ResultsViewer** - Structured output display

---

## 📱 **Detailed Page Specifications**

### **🏠 LANDING PAGE (`/`)**

#### **Purpose**
Convert visitors to creators/users in 30 seconds

#### **Layout Requirements**
```
Header: Logo | "Create Solution" | "Browse Solutions"
Hero: Value prop + demo video/GIF (10 seconds max)
Examples: 4 pre-built solutions with use counts
Footer: Minimal
```

#### **Content Specifications**
- **Headline**: "Turn Your Expertise Into AI Solutions"
- **Subheadline**: "Train AI with your documents. Share solutions instantly."
- **CTA Buttons**: Primary "Create Solution", Secondary "Browse Solutions"
- **Social Proof**: "127 solutions created, 2,349 documents processed"

#### **User Interactions**
- Click "Create Solution" → `/create`
- Click "Browse Solutions" → `/browse`  
- Click example solution → `/use/[solution-id]`

---

### **🛠️ CREATOR PAGE (`/create`)**

#### **Purpose**
Logged-in users can create AI solutions in under 2 minutes

#### **Access Control**
```
Authentication Required:
- Redirect to login if not authenticated
- After login, redirect back to /create
- Show user info in header (avatar/name)
```

#### **Step-by-Step Flow**

#### **Step 1: Problem Definition**
```
Layout: Single column, centered, 600px max width

Fields:
- Solution Name: [Text input, required, 50 char max]
- Problem Description: [Textarea, required, 200 char max]
- Target Users: [Text input, optional, 100 char max]

Example Placeholders:
- Name: "Tax Receipt Organizer"
- Description: "Categorize business receipts for tax filing"
- Users: "Small business owners, freelancers"

Validation:
- Name must be unique
- Description minimum 20 characters

Button: "Next: Train AI" (disabled until valid)
```

#### **Step 2: Document Training**
```
Layout: Split screen - left upload, right chat

Left Panel (40%):
- File upload zone (drag/drop + click)
- Uploaded files list with thumbnails
- Supported: PDF, JPG, PNG, TXT, CSV
- Max: 10 files, 10MB each

Right Panel (60%):
- Chat interface with AI
- Pre-populated: "I've analyzed your documents. What should I focus on?"
- User types training instructions
- AI responds with understanding
- Conversation saves as training context

Training Examples:
User: "Categorize these receipts for business taxes"
AI: "I see restaurant bills, office supplies, and travel expenses. Should I extract amounts and dates too?"
User: "Yes, and note business purpose for meals"
AI: "Got it! I'll identify meal expenses and ask for business context."

Button: "Test Solution" (enabled after 2+ chat exchanges)
```

#### **Step 3: Testing**
```
Layout: Single column with preview

Test Interface:
- "Upload test document" zone
- Real-time AI processing preview
- Results display in structured format
- Quality indicators (confidence score)

Actions:
- "Refine Training" → back to Step 2
- "Publish Solution" → Step 4

Auto-pass criteria:
- AI processes test doc successfully
- Confidence score > 70%
```

#### **Step 4: Publishing**
```
Layout: Summary + sharing options

Display:
- Solution preview card
- Unique shareable URL
- QR code for mobile sharing
- Usage tracking promise

Final Actions:
- "Publish & Share" → solution goes live
- "Create Another" → restart flow
- "Back to Home" → `/` (with filter to show your solutions)

Auto-generate: solution-id (readable slug)
Associate: solution with logged-in user account
```

#### **Technical Requirements**
- User authentication validation
- Save training data to prompt template
- Generate unique solution URLs
- Store solution metadata with user association
- Real-time AI integration for chat
- File processing and storage

---

### **🏪 MARKETPLACE (`/browse`)**

#### **Purpose**
Discover and access existing solutions

#### **Layout Requirements**
```
Header: Search bar + filter dropdown
Grid: Solution cards, 3 columns desktop, 1 mobile
Sidebar: Categories (optional for MVP)
```

#### **Solution Card Specification**
```
Card Layout (300px width):
- Title: Solution name (truncate at 25 chars)
- Creator: "by [username]" (auto-generated)
- Description: 2 lines max
- Usage count: "Used 47 times"
- Rating: Star display (if available)
- "Try It" button

Hover State:
- Slight elevation
- "Try It" button highlights
```

#### **Search & Filter**
```
Search: Text input, searches name + description
Filter Dropdown:
- All Categories
- Tax & Finance  
- Medical & Insurance
- Rental & Legal
- Personal Organization

Sort Options:
- Most Popular (default)
- Newest
- Best Rated (future)
```

#### **User Interactions**
- Search updates grid in real-time
- Filter pills update grid immediately  
- Click "Create Solution" → Login required → `/create`
- Click solution card → `/use/[solution-id]` (no login required)
- Click "Login" → Login modal/flow

---

### **🔐 LOGIN FLOW**

#### **Purpose**
Lightweight authentication for solution creation and history

#### **Login Options**
```
Modal/Popup Interface:
- Google OAuth (primary)
- Email + Password (backup)
- "Continue as Guest" option for usage only

Quick Registration:
- Name + Email + Password
- Auto-login after creation
```

#### **Authentication Logic**
```
Users (Not Logged In):
- Can browse all solutions
- Can use any solution
- Cannot create solutions
- Cannot save usage history
- Results are temporary

Creators/Users (Logged In):
- Can browse and use solutions (user role)
- Can create solutions (creator role)
- Usage history saved
- Solution management dashboard
- Results saved permanently
```

#### **Login Triggers**
```
Required Login:
- Create Solution button
- Save results permanently
- Rate/review solutions

Optional Login Prompts:
- After successful solution usage: "Login to save these results"
- After browsing multiple solutions: "Login to track your favorites"
```

#### **Technical Requirements**
- Search algorithm (simple text matching)
- Grid responsive layout
- Real-time filtering
- Solution metadata display

---

### **⚡ PROCESSOR (`/use/[solution-id]`)**

#### **Purpose**
Use any solution to process documents instantly

#### **Page Layout**
```
Header: Solution name + creator info
Main: Upload zone + results area (split or stacked)
Footer: Rating + sharing options
```

#### **Step-by-Step User Flow**

#### **Step 1: Document Upload**
```
Upload Zone:
- Large drag/drop area
- "Or click to browse" option
- File type indicators
- Progress bars for uploads
- Preview thumbnails

Supported Files:
- Images: JPG, PNG, HEIC
- Documents: PDF, TXT, DOC
- Data: CSV, XLS
- Max: 5 files, 10MB each

Visual States:
- Empty: Dashed border, upload icon
- Hover: Highlighted border
- Uploading: Progress indicator
- Complete: File thumbnails with names
```

#### **Step 2: AI Processing**
```
Processing Display:
- "Processing your documents..." message
- Progress bar (indeterminate)
- AI thinking indicators
- ETA estimate (15-30 seconds)

Technical Requirements:
- Send files to Llama 4 with solution prompt
- Real-time progress updates
- Error handling for processing failures
```

#### **Step 3: Results Display**
```
Results Layout:
- Structured data table/cards
- Export options (CSV, PDF, JSON)
- Action items or next steps
- Confidence indicators

Example Output Formats:
Tax Receipts: Table with Date, Vendor, Amount, Category, Business Purpose
Medical Bills: Breakdown of charges, insurance coverage, action items
Rental Forms: Completed application fields, missing information alerts

Export Options:
- Download CSV
- Download PDF report  
- Copy to clipboard
- Share via email/link
```

#### **Step 4: Feedback (Optional)**
```
Rating Interface:
- 5-star rating system (requires login)
- Optional comment box (100 chars)
- "Submit Feedback" button

User vs Creator:
- Users (not logged in): "Login to rate this solution"
- Creators/Users (logged in): Full rating interface

Post-Process Actions:
- "Process More Documents"
- "Try Another Solution" → back to `/`
- "Create Similar Solution" → `/create` (with context)
```

#### **Technical Requirements**
- File upload handling
- AI processing integration
- Results formatting  
- Export functionality
- Authentication-aware rating system
- Guest vs logged-in user experience

---

## 🧩 **Component Specifications**

### **FileUploader Component**

#### **Props Interface**
```
{
  accept: string[],           // File types
  maxFiles: number,           // Upload limit
  maxSize: number,            // Size limit (MB)
  onUpload: (files) => void,  // Upload callback
  preview: boolean,           // Show thumbnails
  multiple: boolean           // Multiple files
}
```

#### **Visual States**
- **Empty**: Dashed border, cloud icon, "Drop files here"
- **Hover**: Solid border, highlighted background
- **Uploading**: Progress bars per file
- **Complete**: File grid with thumbnails
- **Error**: Red border, error message

#### **Technical Requirements**
- Drag and drop API
- File validation (type, size)
- Image preview generation
- Upload progress tracking
- Error handling

### **ChatTrainer Component**

#### **Props Interface**
```
{
  context: object,              // Training context
  onMessage: (msg) => void,     // Message handler  
  placeholder: string,          // Input placeholder
  autoStart: string             // Initial AI message
}
```

#### **UI Specifications**
```
Layout: Messages list + input bar
Message Types:
- AI: Left-aligned, blue background, robot icon
- User: Right-aligned, gray background, user icon
- System: Center-aligned, italic text

Input Bar:
- Text area (auto-resize)
- Send button (paper plane icon)
- Character counter (optional)
```

#### **Interaction Patterns**
- Enter to send message
- Shift+Enter for new line
- Auto-scroll to latest message
- Typing indicators
- Message timestamps

### **ResultsViewer Component**

#### **Props Interface**
```
{
  data: object,                 // Processed results
  format: 'table'|'cards',     // Display format
  exportFormats: string[],     // Available exports
  onExport: (format) => void   // Export handler
}
```

#### **Display Formats**
- **Table**: For structured data (receipts, bills)
- **Cards**: For document summaries
- **List**: For action items
- **Mixed**: Combination based on data type

#### **Export Options**
- CSV download for tables
- PDF report generation
- JSON for developers
- Copy to clipboard
- Email sharing

---

## 🔄 **User Flow Mapping**

### **Creator Journey**
```
Landing → Login → Create Solution → Train AI → Test → Publish → Back to Landing
      ↓
  Monitor usage and feedback → Improve solution (future)
```

### **User Journey (Not Logged In)**
```
Landing → Search/Browse → Select Solution → Upload Docs → Get Results → Optional Login Prompt
```

### **Creator/User Journey (Logged In)**
```
Landing → Search/Browse → Select Solution → Upload Docs → Get Results → Rate → Saved to History
      ↓
  Create Own Solution OR Use Another Solution
```

### **Cross-Flow Interactions**
- Users become creators after successful usage
- Creators use other solutions for different problems
- Viral sharing through solution URLs

---

## 📊 **Success Metrics & Validation**

### **Creator Success**
- Solution created in < 2 minutes
- Training requires < 5 chat exchanges
- Publishing success rate > 90%

### **User Success**  
- Find relevant solution in < 30 seconds
- Document processing in < 30 seconds
- Results accuracy satisfaction > 80%

### **Platform Success**
- Solution usage rate > 50% (users try solutions they find)
- Creator conversion rate > 10% (users become creators)
- Sharing rate > 20% (solutions get shared)

---

## 🚀 **Implementation Priority**

### **Must Have (Core Demo)**
1. **Landing with integrated search**: Browse solutions + login flow
2. **Creator flow**: Login-protected solution creation
3. **Processor flow**: Guest-friendly usage with login prompts

### **Should Have (Polish)**
1. **Google OAuth**: Frictionless login
2. **Usage history**: For logged-in users  
3. **Export functionality**: CSV/PDF downloads

### **Could Have (Future)**
1. **User dashboard**: Manage created solutions
2. **Advanced analytics**: Usage tracking per solution
3. **Social features**: Following creators, favorites

---

**Engineering Handoff Notes**: This blueprint prioritizes the core AI training and usage flows. Focus on making the "magic moment" (AI learning from examples) feel seamless and impressive. The marketplace can be simple - a grid of cards is sufficient for demo purposes.