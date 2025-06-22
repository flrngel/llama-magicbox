'use server';

import { ensureInitialized, getStatements, rowToSolution } from '@/lib/database';
import { Solution } from '@/lib/data';

export interface CreateDraftSolutionResult {
  success: boolean;
  data?: { solutionId: string };
  error?: string;
}

export interface UpdateSolutionResult {
  success: boolean;
  data?: Solution;
  error?: string;
}

export interface PublishSolutionResult {
  success: boolean;
  data?: Solution;
  error?: string;
}

// Create a new draft solution for a user
export async function createDraftSolution(creatorId: string): Promise<CreateDraftSolutionResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // User should already exist in database at this point
    
    const solutionId = `solution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    statements.insertDraftSolution.run(solutionId, creatorId);
    
    return {
      success: true,
      data: { solutionId }
    };
  } catch (error) {
    console.error('Error creating draft solution:', error);
    return {
      success: false,
      error: 'Failed to create draft solution'
    };
  }
}

// Update any field of a solution
export async function updateSolutionAction(
  solutionId: string, 
  updates: Partial<Solution>
): Promise<UpdateSolutionResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // Get current solution to verify it exists
    const currentRow = statements.getSolutionById.get(solutionId);
    if (!currentRow) {
      return {
        success: false,
        error: 'Solution not found'
      };
    }
    
    // Update specific fields based on what's provided
    if (updates.systemInstructions !== undefined) {
      statements.updateSolution.run(
        currentRow.name || updates.name || '',
        currentRow.description || updates.description || '',
        currentRow.problem_description || updates.problemDescription || '',
        currentRow.target_users || updates.targetUsers || '',
        updates.systemInstructions,
        currentRow.model_output_structure || updates.modelOutputStructure || '',
        solutionId
      );
    } else {
      // Full update
      statements.updateSolution.run(
        updates.name || currentRow.name || '',
        updates.description || currentRow.description || '',
        updates.problemDescription || currentRow.problem_description || '',
        updates.targetUsers || currentRow.target_users || '',
        updates.systemInstructions || currentRow.system_instructions || '',
        updates.modelOutputStructure || currentRow.model_output_structure || '',
        solutionId
      );
    }
    
    // Return updated solution
    const updatedRow = statements.getSolutionById.get(solutionId);
    const updatedSolution = rowToSolution(updatedRow);
    
    return {
      success: true,
      data: updatedSolution
    };
  } catch (error) {
    console.error('Error updating solution:', error);
    return {
      success: false,
      error: 'Failed to update solution'
    };
  }
}

// Get a solution by ID (including drafts)
export async function getSolutionAction(solutionId: string): Promise<UpdateSolutionResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    const row = statements.getSolutionById.get(solutionId);
    if (!row) {
      return {
        success: false,
        error: 'Solution not found'
      };
    }
    
    const solution = rowToSolution(row);
    
    return {
      success: true,
      data: solution
    };
  } catch (error) {
    console.error('Error getting solution:', error);
    return {
      success: false,
      error: 'Failed to get solution'
    };
  }
}

// Get draft solutions for a creator
export async function getDraftSolutionsAction(creatorId: string): Promise<{ success: boolean; data?: Solution[]; error?: string }> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    const rows = statements.getDraftSolutionsByCreator.all(creatorId);
    const solutions = rows.map((row: any) => rowToSolution(row));
    
    return {
      success: true,
      data: solutions
    };
  } catch (error) {
    console.error('Error getting draft solutions:', error);
    return {
      success: false,
      error: 'Failed to get draft solutions'
    };
  }
}

// Publish a draft solution
export async function publishSolutionAction(
  solutionId: string,
  publishData: {
    slug: string;
    name: string;
    description: string;
    problemDescription: string;
    targetUsers: string;
    category: Solution['category'];
  }
): Promise<PublishSolutionResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // Get current row to preserve system instructions and output structure
    const currentRow = statements.getSolutionById.get(solutionId);
    
    // First update all the required fields while preserving system instructions
    statements.updateSolution.run(
      publishData.name,
      publishData.description,
      publishData.problemDescription,
      publishData.targetUsers,
      currentRow.system_instructions || '', // Keep existing system instructions
      currentRow.model_output_structure || '', // Keep existing model output structure
      solutionId
    );
    
    // Then publish the solution with slug  
    statements.publishSolution.run(publishData.slug, solutionId);
    
    // No need to update again since we already preserved the instructions above
    
    // Return updated solution
    const updatedRow = statements.getSolutionById.get(solutionId);
    const updatedSolution = rowToSolution(updatedRow);
    
    return {
      success: true,
      data: updatedSolution
    };
  } catch (error) {
    console.error('Error publishing solution:', error);
    return {
      success: false,
      error: 'Failed to publish solution'
    };
  }
}

// Unpublish a solution (change status back to draft)
export async function unpublishSolutionAction(solutionId: string): Promise<UpdateSolutionResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // Get current solution to verify it exists and is published
    const currentRow = statements.getSolutionById.get(solutionId);
    if (!currentRow) {
      return {
        success: false,
        error: 'Solution not found'
      };
    }
    
    if (currentRow.status !== 'published') {
      return {
        success: false,
        error: 'Solution is not published'
      };
    }
    
    // Update status to draft
    statements.unpublishSolution.run(solutionId);
    
    // Return updated solution
    const updatedRow = statements.getSolutionById.get(solutionId);
    const updatedSolution = rowToSolution(updatedRow);
    
    return {
      success: true,
      data: updatedSolution
    };
  } catch (error) {
    console.error('Error unpublishing solution:', error);
    return {
      success: false,
      error: 'Failed to unpublish solution'
    };
  }
}

// Delete a solution and all its related data
export async function deleteSolutionAction(solutionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // Get current solution to verify it exists
    const currentRow = statements.getSolutionById.get(solutionId);
    if (!currentRow) {
      return {
        success: false,
        error: 'Solution not found'
      };
    }
    
    // Delete the solution (cascade will delete related data_items)
    statements.deleteSolution.run(solutionId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting solution:', error);
    return {
      success: false,
      error: 'Failed to delete solution'
    };
  }
}