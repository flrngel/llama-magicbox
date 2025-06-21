export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Represents a single piece of data used for training or processing.
 * A Solution is trained using multiple DataItems.
 */
export interface DataItem {
  id: string;
  /** The ID of the Solution this item belongs to. */
  solutionId: string;
  /** The type of the uploaded data. */
  type: 'image' | 'pdf' | 'text' | 'csv';
  /** The data URI of the uploaded file content. */
  content_uri: string;
  /** The instruction from the creator for this specific training example. */
  guided_prompt: string;
  /** The structured output from the model for this item, used for review and refinement. */
  model_output: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a document processing solution created by a user.
 */
export interface Solution {
  id: string;
  slug: string;
  name:string;
  description: string;
  /** A more detailed explanation of the problem this solution addresses. */
  problemDescription: string;
  /** A description of the ideal user for this solution. */
  targetUsers: string;
  /** The ID of the user who created this solution. */
  creatorId: string;
  /** A human-readable creator name, e.g., "by CleverPanda42" */
  creator: string;
  usageCount: number;
  rating: number;
  category: 'Tax & Finance' | 'Medical & Insurance' | 'Rental & Legal' | 'Personal Organization';
  /** An array of DataItem IDs used to train this solution. */
  trainingDataItems: string[];
  /**
   * The core 'trained' prompt that instructs the AI on how to process documents.
   * This is synthesized from the guided prompts of its training data items.
   */
  systemInstructions: string;
  /**
   * A string representation of a Zod schema that defines the expected JSON output structure.
   * Example: "z.object({ name: z.string(), amount: z.number() })"
   */
  modelOutputStructure: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- MOCK DATABASE ---

let solutions: Solution[] = [
  {
    id: "1",
    slug: "tax-receipt-organizer",
    name: "Tax Receipt Organizer",
    creatorId: "user-42",
    creator: "by CleverPanda42",
    description: "Categorize business receipts for tax filing.",
    problemDescription: "This solution automatically extracts key information from your receipts, like vendor, date, and amount, and categorizes them for easy tax filing.",
    targetUsers: "Small business owners, freelancers, accountants",
    usageCount: 47,
    rating: 4.5,
    category: "Tax & Finance",
    trainingDataItems: ["data-item-1", "data-item-2"],
    systemInstructions: `You are an expert accountant. Extract vendor, date, and total amount from the receipt. Use the user's guided prompts to determine the expense category. Output valid JSON that adheres to the provided schema.`,
    modelOutputStructure: `z.object({ expenseCategory: z.string(), date: z.string(), vendor: z.string(), amount: z.number() })`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    slug: "rental-application-extractor",
    name: "Rental Application Extractor",
    creatorId: "user-91",
    creator: "by AgileEagle91",
    description: "Extract applicant info from rental forms.",
    problemDescription: "Quickly pull applicant names, contact info, and employment history from various rental application formats into a structured summary.",
    targetUsers: "Landlords, property managers",
    usageCount: 89,
    rating: 4.2,
    category: "Rental & Legal",
    trainingDataItems: [],
    systemInstructions: `You are an expert at extracting data from rental applications. Extract the applicant's full name, contact information (phone and email), employment history, and references. Output valid JSON.`,
    modelOutputStructure: `z.object({ applicantName: z.string(), contactInformation: z.object({ phone: z.string(), email: z.string() }), employmentHistory: z.array(z.object({ employer: z.string(), position: z.string(), startDate: z.string(), endDate: z.string().optional() })), references: z.array(z.object({ name: z.string(), relationship: z.string(), contact: z.string() })) })`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
   // Add other solutions from the original list, adapted to the new model
];

let dataItems: DataItem[] = [
    {
        id: "data-item-1",
        solutionId: "1",
        type: 'image',
        content_uri: 'placeholder/receipt-bistro.jpg',
        guided_prompt: 'This is a meal expense.',
        model_output: {
            expenseCategory: "Meals & Entertainment",
            date: "2023-10-26",
            vendor: "The Corner Bistro",
            amount: 45.50
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "data-item-2",
        solutionId: "1",
        type: 'image',
        content_uri: 'placeholder/receipt-office-supplies.png',
        guided_prompt: 'This is for office supplies.',
        model_output: {
            expenseCategory: "Office Supplies",
            date: "2023-10-28",
            vendor: "Staples",
            amount: 112.30
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

// --- DATA ACCESS FUNCTIONS ---

export const getSolutions = (): Solution[] => solutions;

export const getSolutionById = (id: string): Solution | undefined => solutions.find(s => s.id === id);

export const getSolutionBySlug = (slug: string): Solution | undefined => solutions.find(s => s.slug === slug);

export const getCategories = (): string[] => Array.from(new Set(solutions.map(s => s.category)));

export const getDataItemsForSolution = (solutionId: string): DataItem[] => dataItems.filter(item => item.solutionId === solutionId);

// --- MUTATION FUNCTIONS (for MVP runtime changes) ---

/**
 * Publishes a new solution and its associated data items to the in-memory store.
 * This is the final step of the creation process.
 */
export const publishSolutionWithDataItems = (
  solutionData: Omit<Solution, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'trainingDataItems'>,
  dataItemsData: Omit<DataItem, 'id' | 'solutionId' | 'createdAt' | 'updatedAt'>[]
): Solution => {
  // 1. Create the solution to get a new ID
  const newSolution: Solution = {
    ...solutionData,
    id: `sol-${Date.now()}`,
    slug: solutionData.name.toLowerCase().replace(/\s+/g, '-').slice(0, 50),
    usageCount: 0,
    rating: 0,
    trainingDataItems: [], // will be populated next
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 2. Create data items and link them to the new solution
  const newDataItemIds: string[] = [];
  for (const itemData of dataItemsData) {
    const newDataItem: DataItem = {
      ...itemData,
      id: `di-${Date.now()}-${Math.random()}`,
      solutionId: newSolution.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dataItems.push(newDataItem);
    newDataItemIds.push(newDataItem.id);
  }

  // 3. Update solution with the new data item IDs
  newSolution.trainingDataItems = newDataItemIds;

  // 4. Add the final solution to the store
  solutions.unshift(newSolution);
  
  return newSolution;
};


/** Updates an existing solution. */
export const updateSolution = (solutionId: string, updates: Partial<Solution>): Solution | undefined => {
    const solutionIndex = solutions.findIndex(s => s.id === solutionId);
    if (solutionIndex === -1) return undefined;
    
    solutions[solutionIndex] = { ...solutions[solutionIndex], ...updates, updatedAt: new Date() };
    return solutions[solutionIndex];
}