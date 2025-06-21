"use server";

import { categorizeReceipts } from "@/ai/flows/categorize-receipts";
import { extractApplicationData } from "@/ai/flows/extract-application-data";
import { z } from "zod";

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
    // This logic maps a solution to a specific Genkit flow
    // In a real app, this would be more dynamic
    if (input.solutionId === "1") { // Tax Receipt Organizer
      const result = await categorizeReceipts({
        receiptDataUri: input.fileDataUri,
        instructions: "Categorize this receipt for business tax purposes. Extract vendor, date, and total amount.",
      });
      return { success: true, data: result };
    } else if (input.solutionId === "3") { // Rental Application Extractor
      const result = await extractApplicationData({
        applicationDataUri: input.fileDataUri,
      });
      return { success: true, data: result };
    } else {
      // Generic fallback for other solutions
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing
      return { success: true, data: { message: "Document processed successfully (simulated).", extracted_text: "Lorem ipsum dolor sit amet..." } };
    }
  } catch (error) {
    console.error("AI processing error:", error);
    return { success: false, error: "Failed to process document with AI." };
  }
}
