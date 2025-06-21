"use server";

import { z } from "zod";
import { getSolutionById } from "@/lib/data";
import { processDocument } from "@/ai/flows/process-document-flow";

const processDocumentSchema = z.object({
  fileDataUri: z.string(),
  solutionId: z.string(),
});

export async function processDocumentAction(formData: FormData) {
  const input = processDocumentSchema.parse({
    fileDataUri: formData.get('fileDataUri'),
    solutionId: formData.get('solutionId'),
  });

  try {
    const solution = getSolutionById(input.solutionId);

    if (!solution) {
      return { success: false, error: "Solution not found." };
    }
    
    if (!solution.systemInstructions || !solution.modelOutputStructure) {
      return { success: false, error: "This solution is not fully configured for processing." };
    }

    const result = await processDocument({
      fileDataUri: input.fileDataUri,
      systemInstructions: solution.systemInstructions,
      modelOutputStructure: solution.modelOutputStructure,
    });
    
    return { success: true, data: result };

  } catch (error) {
    console.error("AI processing error:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        return { success: false, error: "The AI returned data in an unexpected format. The solution creator may need to refine the instructions." };
    }
    return { success: false, error: "Failed to process document with AI. Please try again." };
  }
}