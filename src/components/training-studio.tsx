"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileUploader } from "./file-uploader";
import { TrainingSession } from "./training-session";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Plus, X } from "lucide-react";
import { Solution, DataItem } from "@/lib/data";
import { processDocument } from "@/ai/flows/process-document-flow";
import { useToast } from "@/hooks/use-toast";
import { getDataItemsAction, createDataItemAction, deleteDataItemAction } from "@/app/actions/data-item-actions";
// MarkitdownService is server-side only, we use the API endpoint instead

// Helper function to determine file type for database storage
function determineFileType(file: File): DataItem['type'] {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split('.').pop() || '';
  
  // Images
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  
  // PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  
  // CSV
  if (mimeType === 'text/csv' || extension === 'csv') {
    return 'csv';
  }
  
  // Office Documents
  if (mimeType.includes('msword') || 
      mimeType.includes('officedocument.wordprocessingml') ||
      mimeType.includes('officedocument.spreadsheetml') ||
      mimeType.includes('officedocument.presentationml') ||
      mimeType.includes('ms-excel') ||
      mimeType.includes('ms-powerpoint') ||
      mimeType.includes('opendocument') ||
      ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(extension)) {
    return 'document';
  }
  
  // Audio files
  if (mimeType.startsWith('audio/') || 
      ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
    return 'audio';
  }
  
  // Archives
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') ||
      ['zip', 'tar', 'gz', '7z', 'rar'].includes(extension)) {
    return 'archive';
  }
  
  // Email files
  if (mimeType === 'message/rfc822' || mimeType.includes('ms-outlook') ||
      ['eml', 'msg'].includes(extension)) {
    return 'email';
  }
  
  // Text-based files (default for most other files)
  if (mimeType.startsWith('text/') || 
      mimeType === 'application/json' ||
      mimeType.includes('xml') ||
      ['txt', 'md', 'json', 'xml', 'html', 'htm', 'rtf', 'py', 'js', 'ts', 'css', 'yaml', 'yml'].includes(extension)) {
    return 'text';
  }
  
  // Fallback for anything else
  return 'other';
}

export interface TrainingDocument {
  id: string;
  file: File;
  dataUri: string;
  processedContent?: string; // Markdown content for non-images
  isImage: boolean;
  dataItemId?: string; // Link to database record
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
  solution: Solution;
  updateSolution: (updates: Partial<Solution>) => Promise<void>;
  onComplete: () => void;
  onBack: () => void;
}

export function TrainingStudio({ solution, updateSolution, onComplete, onBack }: TrainingStudioProps) {
  const [trainingDocuments, setTrainingDocuments] = useState<TrainingDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const { toast } = useToast();

  // Check if this is an existing solution being edited (has system instructions or is published)
  const isEditingExistingSolution = Boolean(solution.systemInstructions || solution.status === 'published');
  const [hasShownEditNotice, setHasShownEditNotice] = useState(false);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  const [hasLoadedPreviousTraining, setHasLoadedPreviousTraining] = useState(false);
  const [showPreviousTrainingNotice, setShowPreviousTrainingNotice] = useState(false);

  // Load existing training documents from database
  const loadExistingTrainingDocuments = async () => {
    if (!solution.id || isLoadingExistingData) return;
    
    setIsLoadingExistingData(true);
    try {
      const result = await getDataItemsAction(solution.id);
      if (result.success && result.data && result.data.length > 0) {
        // Convert DataItems to TrainingDocuments
        const existingDocuments: TrainingDocument[] = await Promise.all(
          result.data.map(async (dataItem: DataItem) => {
            // Extract original filename from guided_prompt if available
            let fileName = `training-doc-${dataItem.id.split('-').pop()}.txt`;
            const guidedPrompt = dataItem.guided_prompt || '';
            
            // Check if guided_prompt contains filename in format "filename:xyz|..."
            if (guidedPrompt.startsWith('filename:')) {
              const filenameMatch = guidedPrompt.match(/^filename:([^|]+)\|/);
              if (filenameMatch && filenameMatch[1]) {
                fileName = filenameMatch[1];
              }
            } else if (guidedPrompt.includes('Training document: ')) {
              // Fallback: try to extract from old format "Training document: filename"
              const match = guidedPrompt.match(/Training document: (.+)$/);
              if (match && match[1]) {
                fileName = match[1];
              }
            }
            
            // Determine the correct MIME type based on the stored type and filename
            let mimeType = 'text/plain';
            if (dataItem.type === 'image') {
              // Try to infer image type from filename extension
              const ext = fileName.toLowerCase().split('.').pop();
              if (ext === 'png') mimeType = 'image/png';
              else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
              else if (ext === 'gif') mimeType = 'image/gif';
              else if (ext === 'webp') mimeType = 'image/webp';
              else mimeType = 'image/jpeg'; // default for images
            } else if (dataItem.type === 'pdf') {
              mimeType = 'application/pdf';
            } else if (dataItem.type === 'csv') {
              mimeType = 'text/csv';
            }
            
            // For images, we can create an empty file since we have the dataUri
            // For other types, include a placeholder content
            const fileContent = dataItem.type === 'image' 
              ? '' 
              : `Training document from previous session\nOriginal URI: ${dataItem.content_uri}`;
            const file = new File([fileContent], fileName, { type: mimeType });
            
            return {
              id: `existing-${dataItem.id}`,
              file,
              dataUri: dataItem.content_uri,
              isImage: dataItem.type === 'image',
              processedContent: dataItem.type !== 'image' ? dataItem.content_uri : undefined,
              dataItemId: dataItem.id,
              status: 'approved' as const, // Mark existing training as approved
              aiOutput: dataItem.model_output,
              confidence: dataItem.model_output ? calculateConfidence(dataItem.model_output) : 0,
              chatHistory: [{
                sender: 'ai' as const,
                message: `This document was used in previous training. You can review the output and make adjustments if needed.`,
                timestamp: new Date(dataItem.createdAt)
              }]
            };
          })
        );
        
        setTrainingDocuments(existingDocuments);
        setHasLoadedPreviousTraining(true);
        setShowPreviousTrainingNotice(true);
        toast({
          title: "Previous Training Loaded",
          description: `Found ${existingDocuments.length} previously trained documents.`
        });
      }
    } catch (error) {
      console.error('Error loading existing training documents:', error);
      toast({
        title: "Loading Error",
        description: "Could not load previous training documents.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingExistingData(false);
    }
  };

  // Clear training documents when solution changes and load existing ones if editing
  useEffect(() => {
    setTrainingDocuments([]);
    setSelectedDocumentId(null);
    setHasShownEditNotice(false);
    setHasLoadedPreviousTraining(false);
    setShowPreviousTrainingNotice(false);
    
    // Load existing training documents if editing an existing solution
    if (isEditingExistingSolution && solution.id) {
      loadExistingTrainingDocuments();
    }
  }, [solution.id, isEditingExistingSolution]);

  // Show notice for editing existing solutions (only if no training data was found)
  useEffect(() => {
    if (isEditingExistingSolution && !hasShownEditNotice && !isLoadingExistingData && trainingDocuments.length === 0) {
      // Only show this if we've finished loading and found no documents
      const timer = setTimeout(() => {
        toast({
          title: "No Previous Training Found",
          description: "This solution doesn't have saved training documents. Upload new documents to train your AI.",
        });
        setHasShownEditNotice(true);
      }, 1000); // Small delay to allow loading to complete
      
      return () => clearTimeout(timer);
    }
  }, [isEditingExistingSolution, hasShownEditNotice, isLoadingExistingData, trainingDocuments.length, toast]);

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
    // Filter out files that are already being processed
    const existingFileNames = trainingDocuments.map(doc => doc.file.name);
    const newFiles = files.filter(file => !existingFileNames.includes(file.name));
    
    if (newFiles.length === 0) {
      toast({ 
        title: "Duplicate Files", 
        description: "These files are already being processed.",
        variant: "destructive"
      });
      return;
    }
    
    for (const file of newFiles) {
      const documentId = `doc-${Date.now()}-${Math.random()}`;
      const isImage = file.type.startsWith('image/');
      
      // Create initial training document
      const initialDocument: TrainingDocument = {
        id: documentId,
        file,
        dataUri: '',
        isImage,
        status: 'processing',
        chatHistory: [],
      };

      setTrainingDocuments(prev => [...prev, initialDocument]);

      try {
        // Step 1: Process file via API
        const processResult = await processFileViaAPI(file);
        const { content: processedContent, isImage: fileIsImage } = processResult;
        
        let dataUri: string;
        let contentForAI: string;

        if (fileIsImage) {
          // For images, the content is already a data URI
          dataUri = processedContent;
          contentForAI = dataUri;
        } else {
          // For other files, we have markdown content
          dataUri = `data:text/markdown;base64,${btoa(processedContent)}`;
          contentForAI = processedContent; // Use markdown content directly
        }

        // Step 2: Update document with processed content
        setTrainingDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, dataUri, processedContent, isImage: fileIsImage }
            : doc
        ));

        // Step 3: Process with AI using the processed content
        console.log('TrainingStudio processing new upload with instructions:', solution.systemInstructions);
        
        const result = await processDocument({
          fileDataUri: contentForAI,
          systemInstructions: solution.systemInstructions || "Extract information from this document.",
          modelOutputStructure: solution.modelOutputStructure || "z.object({})",
        });

        // Step 4: Save to database and update document with AI output
        let dataItemId: string | undefined;
        try {
          // Determine file type based on MIME type and extension
          const fileType = determineFileType(file);

          // Save to database with processed content
          // Include filename in guided_prompt for later retrieval
          const saveResult = await createDataItemAction(
            solution.id!,
            fileType,
            contentForAI, // Store the processed content
            `filename:${file.name}|Training document: ${file.name}`, // Include filename for parsing
            result // model_output
          );

          if (saveResult.success && saveResult.data) {
            dataItemId = saveResult.data.id;
          }
        } catch (saveError) {
          console.error('Error saving to database:', saveError);
          // Continue even if save fails - user can still train locally
        }

        // Step 5: Update document with final results
        setTrainingDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                status: 'ready', 
                aiOutput: result,
                confidence: calculateConfidence(result),
                dataItemId,
                chatHistory: [{
                  sender: 'ai',
                  message: `I've processed your ${fileIsImage ? 'image' : 'document'}. How does the output look? Let me know if I should extract anything differently.`,
                  timestamp: new Date()
                }]
              } 
            : doc
        ));

        toast({ 
          title: "Document Processed", 
          description: `${file.name} has been analyzed by the AI${dataItemId ? ' and saved' : ''}.`
        });

        // No cleanup needed as API handles temporary file management

      } catch (error) {
        console.error('Error processing document:', error);
        setTrainingDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                status: 'needs_work',
                chatHistory: [{
                  sender: 'ai',
                  message: `I had trouble processing this document. Can you help me understand what to extract?`,
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
    }
  };

  // Helper function to process file via API
  const processFileViaAPI = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/files/process', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to process file');
    }
    
    return await response.json();
  };

  const handleDeleteDocument = async (documentId: string) => {
    // Find the document to get its dataItemId if it exists
    const documentToDelete = trainingDocuments.find(doc => doc.id === documentId);
    
    // Delete from database if it has a dataItemId
    if (documentToDelete?.dataItemId) {
      try {
        const deleteResult = await deleteDataItemAction(documentToDelete.dataItemId);
        if (!deleteResult.success) {
          toast({
            title: "Delete Failed",
            description: deleteResult.error || "Failed to delete from database",
            variant: "destructive"
          });
          return; // Don't remove from UI if database delete failed
        }
      } catch (error) {
        console.error('Error deleting data item:', error);
        toast({
          title: "Delete Failed", 
          description: "Failed to delete training document from database",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Remove from local state
    setTrainingDocuments(prev => prev.filter(doc => doc.id !== documentId));
    
    // If the deleted document was selected, clear selection
    if (selectedDocumentId === documentId) {
      setSelectedDocumentId(null);
    }
    
    toast({ 
      title: "Document Removed", 
      description: "Training document has been removed successfully."
    });
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
  // Completion requirements: at least 1 approved document for all solutions
  const isReadyToComplete = isEditingExistingSolution 
    ? (approvedCount >= 1) // Existing solutions need at least 1 approved document
    : (totalCount >= 2 && approvedCount >= 1 && overallConfidence >= 70); // New solutions need 2+ documents, 1+ approved, 70%+ confidence

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline">2. Teach Your AI Model</h2>
          <p className="text-muted-foreground">Show your AI examples of your expertise - no coding required</p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Knowledge Transfer Progress</CardTitle>
          <CardDescription>
            {isEditingExistingSolution && (
              <span className="text-blue-600 font-medium">Refining knowledge model • </span>
            )}
            {approvedCount} of {totalCount} examples approved • {Math.round(overallConfidence)}% AI understanding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallConfidence} className="mb-4" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {isEditingExistingSolution 
                ? "Approve at least 1 example to continue" 
                : "Teach with at least 2 examples, approve 1+"
              }
            </span>
            <span>{isReadyToComplete ? 'AI ready to share your knowledge!' : 'Keep teaching...'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Training Documents List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example Documents</CardTitle>
              <CardDescription>
                Upload and train with example documents
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Upload up to 5 training files. Supports all major formats: PDF, Office docs, images, audio. Max 30MB per file.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingExistingData && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Loading previous training documents...</strong>
                  </p>
                </div>
              )}
              {isEditingExistingSolution && hasLoadedPreviousTraining && showPreviousTrainingNotice && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md relative">
                  <button
                    onClick={() => setShowPreviousTrainingNotice(false)}
                    className="absolute top-2 right-2 text-green-600 hover:text-green-800 rounded-sm hover:bg-green-100 p-1"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-sm text-green-800 pr-6">
                    <strong>Previous training loaded:</strong> Found {trainingDocuments.filter(d => d.dataItemId).length} saved training documents. 
                    You can upload additional documents to continue training.
                  </p>
                </div>
              )}
              <FileUploader 
                onUpload={handleFileUpload} 
                maxFiles={5} 
                multiple
                showFileList={false}
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
                        {doc.dataItemId && <span className="ml-1 text-xs text-green-600">(saved)</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
          {isReadyToComplete 
            ? 'Next: Test Solution' 
            : isEditingExistingSolution && approvedCount === 0
              ? 'Need at least 1 approved document'
              : `Need ${Math.max(0, 2 - totalCount)} more documents`
          }
        </Button>
      </div>
    </div>
  );
}