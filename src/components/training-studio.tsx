"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileUploader } from "./file-uploader";
import { TrainingSession } from "./training-session";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react";
import { Solution, DataItem } from "@/lib/data";
import { processDocument } from "@/ai/flows/process-document-flow";
import { useToast } from "@/hooks/use-toast";

export interface TrainingDocument {
  id: string;
  file: File;
  dataUri: string;
  status: 'processing' | 'ready' | 'approved' | 'needs_work';
  aiOutput?: any;
  confidence?: number;
  chatHistory: Array<{
    sender: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>;
}

interface TrainingStudioProps {
  solution: Partial<Solution>;
  updateSolution: (updates: Partial<Solution>) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function TrainingStudio({ solution, updateSolution, onComplete, onBack }: TrainingStudioProps) {
  const [trainingDocuments, setTrainingDocuments] = useState<TrainingDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const { toast } = useToast();

  // Debug: Monitor solution changes
  useEffect(() => {
    console.log('TrainingStudio solution.systemInstructions:', solution.systemInstructions);
  }, [solution.systemInstructions]);

  // Calculate overall confidence and training progress
  useEffect(() => {
    const approvedDocuments = trainingDocuments.filter(doc => doc.status === 'approved');
    const totalDocuments = trainingDocuments.length;
    
    if (totalDocuments === 0) {
      setOverallConfidence(0);
      return;
    }

    const avgConfidence = approvedDocuments.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / approvedDocuments.length;
    setOverallConfidence(isNaN(avgConfidence) ? 0 : avgConfidence);
  }, [trainingDocuments]);

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const documentId = `doc-${Date.now()}-${Math.random()}`;
      const reader = new FileReader();
      
      reader.onload = async () => {
        const dataUri = reader.result as string;
        
        // Create training document
        const newDocument: TrainingDocument = {
          id: documentId,
          file,
          dataUri,
          status: 'processing',
          chatHistory: [],
        };

        setTrainingDocuments(prev => [...prev, newDocument]);

        // Process document immediately
        try {
          console.log('TrainingStudio processing new upload with instructions:', solution.systemInstructions);
          const result = await processDocument({
            fileDataUri: dataUri,
            systemInstructions: solution.systemInstructions || "Extract information from this document.",
            modelOutputStructure: solution.modelOutputStructure || "z.object({})",
          });

          // Update document with AI output
          setTrainingDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { 
                  ...doc, 
                  status: 'ready', 
                  aiOutput: result,
                  confidence: calculateConfidence(result),
                  chatHistory: [{
                    sender: 'ai',
                    message: `I've processed your document. Here's what I extracted: ${JSON.stringify(result, null, 2)}. How did I do?`,
                    timestamp: new Date()
                  }]
                } 
              : doc
          ));

          toast({ 
            title: "Document Processed", 
            description: `${file.name} has been analyzed by the AI.`
          });

        } catch (error) {
          console.error('Error processing document:', error);
          setTrainingDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { 
                  ...doc, 
                  status: 'needs_work',
                  chatHistory: [{
                    sender: 'ai',
                    message: "I had trouble processing this document. Can you help me understand what to extract?",
                    timestamp: new Date()
                  }]
                } 
              : doc
          ));

          toast({ 
            title: "Processing Error", 
            description: `Failed to process ${file.name}. You can train the AI using the chat.`,
            variant: "destructive"
          });
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const calculateConfidence = (aiOutput: any): number => {
    // Simple confidence calculation based on non-null fields
    if (!aiOutput || typeof aiOutput !== 'object') return 0;
    
    const fields = Object.values(aiOutput);
    const filledFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    );
    
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const getStatusIcon = (status: TrainingDocument['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'ready':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'needs_work':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TrainingDocument['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'needs_work':
        return 'bg-red-100 text-red-800';
    }
  };

  const selectedDocument = trainingDocuments.find(doc => doc.id === selectedDocumentId);
  const approvedCount = trainingDocuments.filter(doc => doc.status === 'approved').length;
  const totalCount = trainingDocuments.length;
  const isReadyToComplete = totalCount >= 2 && approvedCount >= 1 && overallConfidence >= 70;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline">Training Studio</h2>
          <p className="text-muted-foreground">Train your AI with example documents</p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Progress</CardTitle>
          <CardDescription>
            {approvedCount} of {totalCount} documents approved • {Math.round(overallConfidence)}% confidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallConfidence} className="mb-4" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Need at least 2 documents with 1+ approved</span>
            <span>{isReadyToComplete ? 'Ready for testing!' : 'Keep training...'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Training Documents List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Documents</CardTitle>
              <CardDescription>Upload and train with example documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader 
                onUpload={handleFileUpload} 
                maxFiles={5} 
                multiple
              />
              
              <div className="space-y-2">
                {trainingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDocumentId === doc.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDocumentId(doc.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">
                        {doc.file.name}
                      </span>
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getStatusColor(doc.status)}>
                        {doc.status.replace('_', ' ')}
                      </Badge>
                      {doc.confidence && (
                        <span className="text-xs text-muted-foreground">
                          {doc.confidence}% confident
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {trainingDocuments.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Upload documents to start training</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Session */}
        <div className="lg:col-span-2">
          {selectedDocument ? (
            <TrainingSession
              document={selectedDocument}
              solution={solution}
              updateSolution={updateSolution}
              onDocumentUpdate={(updatedDocument) => {
                setTrainingDocuments(prev => prev.map(doc => 
                  doc.id === updatedDocument.id ? updatedDocument : doc
                ));
              }}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">No Document Selected</h3>
                <p className="text-sm">
                  Upload a document or select one from the list to start training
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Previous Step
        </Button>
        <Button 
          onClick={onComplete}
          disabled={!isReadyToComplete}
        >
          {isReadyToComplete ? 'Test Solution' : `Need ${Math.max(0, 2 - totalCount)} more documents`}
        </Button>
      </div>
    </div>
  );
}