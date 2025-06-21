// Client-side data layer that calls API routes
import { Solution, DataItem } from './data';

// Type definitions for API responses
interface SolutionsResponse {
  solutions: Solution[];
}

interface SolutionResponse {
  solution: Solution;
}

interface CreateSolutionRequest {
  solutionData: Omit<Solution, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'trainingDataItems'>;
  dataItemsData: Omit<DataItem, 'id' | 'solutionId' | 'createdAt' | 'updatedAt'>[];
}

// API client functions
export async function fetchSolutions(): Promise<Solution[]> {
  const response = await fetch('/api/solutions');
  if (!response.ok) {
    throw new Error('Failed to fetch solutions');
  }
  const data: SolutionsResponse = await response.json();
  return data.solutions;
}

export async function fetchSolutionById(id: string): Promise<Solution> {
  const response = await fetch(`/api/solutions/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch solution');
  }
  const data: SolutionResponse = await response.json();
  return data.solution;
}

export async function fetchSolutionBySlug(slug: string): Promise<Solution> {
  const response = await fetch(`/api/solutions/slug/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch solution');
  }
  const data: SolutionResponse = await response.json();
  return data.solution;
}

export async function createSolution(request: CreateSolutionRequest): Promise<Solution> {
  const response = await fetch('/api/solutions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create solution');
  }
  
  const data: SolutionResponse = await response.json();
  return data.solution;
}

// Utility functions
export function getCategories(): string[] {
  return ['Tax & Finance', 'Medical & Insurance', 'Rental & Legal', 'Personal Organization'];
}