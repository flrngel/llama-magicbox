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
import { Badge } from "@/components/ui/badge";
import { Terminal, Sparkles, RotateCcw } from "lucide-react";

interface UseSolutionFormProps {
  solution: Solution;
}

interface FileResult {
  fileName: string;
  result: any;
  error?: string;
  isLoading: boolean;
}

export function UseSolutionForm({ solution }: UseSolutionFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileResults, setFileResults] = useState<FileResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const processFile = async (file: File, index: number): Promise<void> => {
    // Update this file's loading state
    setFileResults(prev => prev.map((fr, i) => 
      i === index ? { ...fr, isLoading: true, error: undefined } : fr
    ));

    try {
      // Step 1: Process file via markitdown API
      const formData = new FormData();
      formData.append('file', file);
      
      const processResponse = await fetch('/api/files/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.details || 'Failed to process file');
      }
      
      const processResult = await processResponse.json();
      const { content } = processResult;
      
      // Step 2: Process with AI using the properly formatted content
      const aiFormData = new FormData();
      aiFormData.append('fileDataUri', content);
      aiFormData.append('solutionId', solution.id);

      const result = await processDocumentAction(aiFormData);

      if (result.success) {
        // Update with successful result
        setFileResults(prev => prev.map((fr, i) => 
          i === index ? { ...fr, result: result.data, isLoading: false } : fr
        ));
      } else {
        throw new Error(result.error || "AI processing failed");
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Update with error
      setFileResults(prev => prev.map((fr, i) => 
        i === index ? { 
          ...fr, 
          error: error instanceof Error ? error.message : "Failed to process file",
          isLoading: false 
        } : fr
      ));
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setGlobalError("Please upload at least one document.");
      return;
    }
    
    setIsProcessing(true);
    setGlobalError(null);
    
    // Initialize results for all files
    const initialResults: FileResult[] = files.map(file => ({
      fileName: file.name,
      result: null,
      isLoading: true
    }));
    setFileResults(initialResults);

    // Process all files in parallel
    try {
      await Promise.all(
        files.map((file, index) => processFile(file, index))
      );
    } catch (error) {
      console.error('Error in batch processing:', error);
      setGlobalError("Some files failed to process. Check individual results below.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearResults = () => {
    setFileResults([]);
    setFiles([]);
    setGlobalError(null);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <CardTitle>1. Upload Documents</CardTitle>
            <CardDescription>Upload up to 10 documents to process with this solution. All files will be processed simultaneously for faster results.</CardDescription>
        </CardHeader>
        <CardContent>
            <FileUploader onUpload={setFiles} maxFiles={10} multiple={true} />
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-4">
        <Button size="lg" onClick={handleProcess} disabled={isProcessing || files.length === 0}>
            {isProcessing ? "Processing..." : `Process ${files.length} Document${files.length !== 1 ? 's' : ''}`}
            <Sparkles className="ml-2 h-5 w-5"/>
        </Button>
        {(fileResults.length > 0 || files.length > 0) && (
          <Button size="lg" variant="outline" onClick={handleClearResults} disabled={isProcessing}>
            <RotateCcw className="mr-2 h-4 w-4"/>
            Start Over
          </Button>
        )}
      </div>

      {globalError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Processing Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {fileResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. View Results</CardTitle>
            <CardDescription className="space-y-2">
              <div>
                Results for {fileResults.length} document{fileResults.length !== 1 ? 's' : ''}.
                {isProcessing && " Processing in progress..."}
              </div>
              {fileResults.length > 0 && (
                <div className="text-sm">
                  ✅ {fileResults.filter(fr => fr.result && !fr.isLoading).length} completed • 
                  ⏳ {fileResults.filter(fr => fr.isLoading).length} processing • 
                  ❌ {fileResults.filter(fr => fr.error).length} failed
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fileResults.map((fileResult, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    📄 {fileResult.fileName}
                    {fileResult.isLoading && (
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      </div>
                    )}
                  </h3>
                  {fileResult.error && (
                    <Badge variant="destructive">Error</Badge>
                  )}
                  {fileResult.result && !fileResult.isLoading && (
                    <Badge variant="default">✓ Complete</Badge>
                  )}
                </div>
                
                {fileResult.isLoading && (
                  <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <p>AI is processing this document...</p>
                  </div>
                )}
                
                {fileResult.error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Processing Failed</AlertTitle>
                    <AlertDescription>{fileResult.error}</AlertDescription>
                  </Alert>
                )}
                
                {fileResult.result && !fileResult.isLoading && (
                  <ResultsViewer data={fileResult.result} format="auto" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {fileResults.some(fr => fr.result && !fr.isLoading) && (
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
