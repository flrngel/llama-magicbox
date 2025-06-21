export interface Solution {
  id: string;
  slug: string;
  name: string;
  description: string;
  creator: string;
  usageCount: number;
  rating: number;
  category: 'Tax & Finance' | 'Medical & Insurance' | 'Rental & Legal' | 'Personal Organization';
  exampleOutput: any;
  problemDescription: string;
  targetUsers: string;
}

const solutions: Solution[] = [
  {
    id: "1",
    slug: "tax-receipt-organizer",
    name: "Tax Receipt Organizer",
    creator: "by CleverPanda42",
    description: "Categorize business receipts for tax filing.",
    usageCount: 47,
    rating: 4.5,
    category: "Tax & Finance",
    problemDescription: "This solution automatically extracts key information from your receipts, like vendor, date, and amount, and categorizes them for easy tax filing.",
    targetUsers: "Small business owners, freelancers, accountants",
    exampleOutput: {
      expenseCategory: "Meals & Entertainment",
      date: "2023-10-26",
      vendor: "The Corner Bistro",
      amount: 45.50
    }
  },
  {
    id: "2",
    slug: "medical-bill-analyzer",
    name: "Medical Bill Analyzer",
    creator: "by BrightTiger73",
    description: "Break down complex medical bills and check coverage.",
    usageCount: 23,
    rating: 4.8,
    category: "Medical & Insurance",
    problemDescription: "Understand your medical bills. This tool extracts services, costs, and insurance adjustments to give you a clear summary.",
    targetUsers: "Patients, caregivers, insurance agents",
    exampleOutput: {
      provider: "City General Hospital",
      service_date: "2023-09-15",
      total_charges: 1250.00,
      insurance_paid: 1000.00,
      patient_responsibility: 250.00,
    }
  },
  {
    id: "3",
    slug: "rental-application-extractor",
    name: "Rental Application Extractor",
    creator: "by AgileEagle91",
    description: "Extract applicant info from rental forms.",
    usageCount: 89,
    rating: 4.2,
    category: "Rental & Legal",
    problemDescription: "Quickly pull applicant names, contact info, and employment history from various rental application formats into a structured summary.",
    targetUsers: "Landlords, property managers",
    exampleOutput: {
      applicantName: "Jane Doe",
      contactInformation: { phone: "555-123-4567", email: "jane.doe@email.com" },
      employmentHistory: [{ employer: "Tech Corp", position: "Software Engineer", startDate: "2021-06-01", endDate: "Present" }],
      references: [{ name: "John Smith", relationship: "Former Landlord", contact: "555-765-4321" }]
    }
  },
  {
    id: "4",
    slug: "invoice-data-entry",
    name: "Invoice Data Entry",
    creator: "by FancyWolf28",
    description: "Automate data entry from invoices into CSV.",
    usageCount: 112,
    rating: 4.6,
    category: "Tax & Finance",
    problemDescription: "Eliminate manual data entry. This solution extracts invoice number, due date, line items, and totals, preparing the data for your accounting software.",
    targetUsers: "Bookkeepers, small businesses",
    exampleOutput: {
      invoice_number: "INV-2023-001",
      vendor: "Office Supplies Co.",
      due_date: "2023-11-30",
      total_amount: 199.99
    }
  },
  {
    id: "5",
    slug: "business-card-scanner",
    name: "Business Card Scanner",
    creator: "by EagerBear56",
    description: "Digitize contact information from business cards.",
    usageCount: 76,
    rating: 4.9,
    category: "Personal Organization",
    problemDescription: "Scan business cards and get perfectly formatted contact information, ready to be added to your address book.",
    targetUsers: "Sales professionals, networkers",
    exampleOutput: {
      name: "John Doe",
      title: "CEO",
      company: "Innovate Inc.",
      phone: "123-456-7890",
      email: "john.doe@innovate.com"
    }
  },
  {
    id: "6",
    slug: "legal-document-summarizer",
    name: "Legal Document Summarizer",
    creator: "by GreatFox84",
    description: "Get key points and summaries from legal texts.",
    usageCount: 34,
    rating: 4.1,
    category: "Rental & Legal",
    problemDescription: "Tired of reading dense legal contracts? This tool provides a high-level summary, identifies key clauses, and defines complex terms.",
    targetUsers: "Lawyers, paralegals, anyone signing a contract",
    exampleOutput: {
      document_type: "Lease Agreement",
      summary: "A 12-month residential lease agreement for the property at 123 Main St...",
      key_clauses: ["Rent amount and due date", "Security deposit", "Termination clause"]
    }
  }
];

export const getSolutions = () => solutions;

export const getSolutionById = (id: string) => solutions.find(s => s.id === id);

export const getSolutionBySlug = (slug: string) => solutions.find(s => s.slug === slug);

export const getCategories = () => Array.from(new Set(solutions.map(s => s.category)));