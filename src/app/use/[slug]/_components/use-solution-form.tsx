"use client";

import { useState } from "react";
import { Solution } from "@/lib/data";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { ResultsViewer } from "@/components/results-viewer";
import { StarRating } from "@/components/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { processDocumentAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Sparkles } from "lucide-react";

interface UseSolutionFormProps {
  solution: Solution;
}

export function UseSolutionForm({ solution }: UseSolutionFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (files.length === 0) {
      setError("Please upload a document first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults(null);

    const file = files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const fileDataUri = reader.result as string;
      
      const formData = new FormData();
      formData.append('fileDataUri', fileDataUri);
      formData.append('solutionId', solution.id);

      const result = await processDocumentAction(formData);

      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error || "An unknown error occurred.");
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
        setError("Failed to read file.");
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <CardTitle>1. Upload Documents</CardTitle>
            <CardDescription>Upload the document you want to process with this solution.</CardDescription>
        </CardHeader>
        <CardContent>
            <FileUploader onUpload={setFiles} maxFiles={1} />
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button size="lg" onClick={handleProcess} disabled={isLoading || files.length === 0}>
            {isLoading ? "Processing..." : "Process Documents"}
            <Sparkles className="ml-2 h-5 w-5"/>
        </Button>
      </div>

      {(isLoading || results || error) && (
        <Card>
            <CardHeader>
                <CardTitle>2. View Results</CardTitle>
                <CardDescription>Here is the information extracted by the AI.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex items-center justify-center p-8 space-x-2">
                        <div className="h-4 w-4 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="h-4 w-4 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="h-4 w-4 bg-primary rounded-full animate-pulse"></div>
                        <p className="ml-2 text-muted-foreground">AI is thinking...</p>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Processing Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {results && <ResultsViewer data={results} />}
            </CardContent>
        </Card>
      )}

      {results && (
          <Card>
            <CardHeader>
                <CardTitle>3. Provide Feedback</CardTitle>
                <CardDescription>Help improve this solution by rating your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <StarRating />
                <Textarea placeholder="Optional: Share your thoughts on the result quality... (max 100 chars)" maxLength={100} />
                <Button>Submit Feedback</Button>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
