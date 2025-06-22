"use server";

import { updateSolution } from "@/lib/db-operations";
import { Solution } from "@/lib/data";

export async function updateSolutionAction(solutionId: string, updates: Partial<Solution>) {
  try {
    const updatedSolution = updateSolution(solutionId, updates);
    return { success: true, data: updatedSolution };
  } catch (error) {
    console.error('Error updating solution:', error);
    return { success: false, error: 'Failed to update solution' };
  }
}