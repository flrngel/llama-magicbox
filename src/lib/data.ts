// Type definitions
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
  name: string;
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
  /** Status of the solution: 'draft' for work-in-progress, 'published' for live solutions */
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

// Re-export database operations
export {
  getSolutions,
  getSolutionById,
  getSolutionBySlug,
  getCategories,
  getDataItemsForSolution,
  publishSolutionWithDataItems,
  updateSolution,
  incrementSolutionUsage,
  createUser,
  getUserById,
  getUserByEmail,
  createDataItem,
  updateDataItemModelOutput,
} from './db-operations';