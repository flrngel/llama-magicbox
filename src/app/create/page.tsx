"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/file-uploader";
import { ResultsViewer } from "@/components/results-viewer";
import { TrainingStudio } from "@/components/training-studio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Share2, Sparkles, Lock, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Solution } from "@/lib/data";
import { createSolution } from "@/lib/data-client";
import { useToast } from "@/hooks/use-toast";
import { generateOutputSchema } from "@/ai/flows/generate-output-schema";
import { processDocument } from "@/ai/flows/process-document-flow";
import { 
  createDraftSolution, 
  updateSolutionAction, 
  getSolutionAction,
  publishSolutionAction,
  deleteSolutionAction 
} from "@/app/actions/solution-actions";
import { createOrGetUser } from "@/app/actions/user-actions";

// Define the initial state for a new solution to ensure all fields are controlled from the start.
const getInitialSolutionState = (): Partial<Solution> => ({
  name: "",
  description: "",
  targetUsers: "",
  modelOutputStructure: "",
  systemInstructions: "You are a helpful AI assistant. Extract information from the provided document based on the user's requirements and return it as a structured JSON object.",
  trainingDataItems: [],
});

function CreatePageContent() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const editSolutionId = searchParams.get('edit');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [step, setStep] = useState(1);
  
  const [currentSolution, setCurrentSolution] = useState<Solution | null>(null);
  const [solutionId, setSolutionId] = useState<string | null>(null);
  const [outputStructureDescription, setOutputStructureDescription] = useState("");
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  
  // Local form state - only sync to server when needed
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetUsers: ""
  });


  // State for Test Step
  const [testFile, setTestFile] = useState<File[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Load existing solution for editing (only when editSolutionId is provided)
  const loadExistingSolution = useCallback(async () => {
    if (!user || !editSolutionId || solutionId || isCreatingDraft) return;
    
    setIsCreatingDraft(true);
    try {
      // First ensure user exists in database
      const userResult = await createOrGetUser(user);
      if (!userResult.success) {
        toast({ title: "Error", description: "Failed to create user record", variant: "destructive" });
        return;
      }
      
      // Load existing solution for editing
      const solutionResult = await getSolutionAction(editSolutionId);
      if (solutionResult.success) {
        const solution = solutionResult.data!;
        
        // Check if user owns this solution
        if (solution.creatorId !== user.id) {
          toast({ title: "Access Denied", description: "You can only edit your own solutions", variant: "destructive" });
          return;
        }
        
        setSolutionId(editSolutionId);
        setCurrentSolution(solution);
        
        // Load existing data into form
        setFormData({
          name: solution.name || "",
          description: solution.description || "",
          targetUsers: solution.targetUsers || ""
        });
        
        // If solution has output structure, set the description field too
        if (solution.modelOutputStructure) {
          setOutputStructureDescription("Output structure already generated");
        }
        
        toast({ title: "Solution Loaded", description: `Editing "${solution.name || 'Untitled Solution'}"` });
      } else {
        toast({ title: "Error", description: "Solution not found", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error loading existing solution:', error);
      toast({ title: "Error", description: "Failed to load solution", variant: "destructive" });
    } finally {
      setIsCreatingDraft(false);
    }
  }, [user, editSolutionId, solutionId, isCreatingDraft, toast]);

  // Create draft solution (called when user clicks Next from step 1)
  const createDraftWhenNeeded = useCallback(async () => {
    if (!user || solutionId || isCreatingDraft) return null;
    
    setIsCreatingDraft(true);
    try {
      // First ensure user exists in database
      const userResult = await createOrGetUser(user);
      if (!userResult.success) {
        toast({ title: "Error", description: "Failed to create user record", variant: "destructive" });
        return null;
      }
      
      // Create new draft solution
      const result = await createDraftSolution(user.id);
      if (result.success) {
        setSolutionId(result.data!.solutionId);
        // Initialize with basic data
        await updateSolutionAction(result.data!.solutionId, {
          systemInstructions: "You are a helpful AI assistant. Extract information from the provided document based on the user's requirements and return it as a structured JSON object."
        });
        // Load the solution
        const solutionResult = await getSolutionAction(result.data!.solutionId);
        if (solutionResult.success) {
          setCurrentSolution(solutionResult.data!);
          return result.data!.solutionId;
        }
      } else {
        toast({ title: "Error", description: "Failed to create draft solution", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error('Error creating draft solution:', error);
      toast({ title: "Error", description: "Failed to create draft solution", variant: "destructive" });
      return null;
    } finally {
      setIsCreatingDraft(false);
    }
    return null;
  }, [user, solutionId, isCreatingDraft, toast]);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginModal(true);
    } else if (!isLoading && user && !solutionId && editSolutionId) {
      // Only load existing solution if we're in edit mode
      loadExistingSolution();
    }
  }, [user, isLoading, solutionId, editSolutionId, loadExistingSolution]);

  // Load form data when solution changes (e.g., returning to step 1)
  useEffect(() => {
    if (currentSolution) {
      setFormData({
        name: currentSolution.name || "",
        description: currentSolution.description || "",
        targetUsers: currentSolution.targetUsers || ""
      });
    }
  }, [currentSolution]);

  // Clear form data when switching from edit mode to create mode
  // Only reset if editSolutionId changes from having a value to null (user clicked "Create" while editing)
  const [previousEditSolutionId, setPreviousEditSolutionId] = useState<string | null>(null);
  
  useEffect(() => {
    if (previousEditSolutionId && !editSolutionId) {
      // User navigated from edit mode to create mode - reset everything
      setCurrentSolution(null);
      setSolutionId(null);
      setOutputStructureDescription("");
      setFormData({ name: "", description: "", targetUsers: "" });
      setTestFile([]);
      setTestResult(null);
      setTestError(null);
      setStep(1);
    }
    setPreviousEditSolutionId(editSolutionId);
  }, [editSolutionId, previousEditSolutionId]);


  const handlePublish = async () => {
    if (!currentSolution || !solutionId) {
      toast({ title: "Error", description: "No solution to publish", variant: "destructive" });
      return;
    }
    
    try {
      const slug = `${currentSolution.name?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
      
      const result = await publishSolutionAction(solutionId, {
        slug,
        name: currentSolution.name!,
        description: currentSolution.description!,
        problemDescription: currentSolution.description!,
        targetUsers: currentSolution.targetUsers!,
        category: (currentSolution.category || 'Personal Organization') as Solution['category'],
      });
      
      if (result.success) {
        setCurrentSolution(result.data!);
        toast({ title: "Solution Published!", description: `${currentSolution.name} is now live.` });
        setStep(s => s + 1);
      } else {
        toast({ title: "Publication Failed", description: result.error || "Failed to publish solution.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error publishing solution:', error);
      toast({ title: "Publication Failed", description: "Failed to publish solution. Please try again.", variant: "destructive" });
    }
  };
  
  const handleStep1Next = async () => {
    // Basic form validation
    if (formData.name.length === 0 || formData.description.length < 20 || 
        ((!outputStructureDescription || outputStructureDescription.length < 10) && !hasExistingOutputStructure)) {
      return;
    }
    
    setIsGeneratingSchema(true);
    try {
        let currentSolutionId = solutionId;
        
        // Create draft if this is a new solution (not editing)
        if (!currentSolutionId && !editSolutionId) {
          currentSolutionId = await createDraftWhenNeeded();
          if (!currentSolutionId) {
            throw new Error("Failed to create draft solution");
          }
        }
        
        if (!currentSolutionId) {
          throw new Error("No solution ID available");
        }
        
        // Update solution with local form data
        await updateSolutionAction(currentSolutionId, {
          name: formData.name,
          description: formData.description,
          targetUsers: formData.targetUsers
        });
        
        // Generate schema only if we don't already have one or if user provided new description
        if (!hasExistingOutputStructure || (outputStructureDescription && outputStructureDescription !== "Output structure already generated")) {
          const result = await generateOutputSchema({ description: outputStructureDescription });
          if (result && result.schema) {
              await updateSolutionAction(currentSolutionId, { modelOutputStructure: result.schema });
              toast({ title: "Output Structure Generated", description: "The AI has created a data schema." });
          } else { 
            throw new Error("Failed to generate schema from AI."); 
          }
        } else {
          toast({ title: "Solution Updated", description: "Your solution details have been saved." });
        }
        
        // Reload solution
        const updatedResult = await getSolutionAction(currentSolutionId);
        if (updatedResult.success) {
          setCurrentSolution(updatedResult.data!);
        }
        
        setStep(s => s + 1);
    } catch (error) {
        console.error("Error processing step 1:", error);
        toast({ title: "Update Failed", description: "Please try again.", variant: "destructive" });
    } finally { 
        setIsGeneratingSchema(false); 
    }
  };

  const handleRunTest = async () => {
    if (testFile.length === 0 || !currentSolution) return;
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    const file = testFile[0];
    
    // Validate solution data before processing
    if (!currentSolution.systemInstructions) {
      setTestError("No system instructions found. Please complete step 2 training first.");
      setIsTesting(false);
      return;
    }
    
    if (!currentSolution.modelOutputStructure) {
      setTestError("No output structure defined. Please complete step 1 first.");
      setIsTesting(false);
      return;
    }
    
    console.log('Step 3 Test - Solution data:', {
      systemInstructions: currentSolution.systemInstructions,
      modelOutputStructure: currentSolution.modelOutputStructure,
      fileName: file.name,
      fileType: file.type
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const fileDataUri = reader.result as string;
      try {
        const result = await processDocument({
          fileDataUri: fileDataUri,
          systemInstructions: currentSolution.systemInstructions!,
          modelOutputStructure: currentSolution.modelOutputStructure!,
        });
        setTestResult(result);
      } catch (e) {
        console.error('Step 3 Test Error:', e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setTestError(`Document processing failed: ${errorMessage}. You may need to refine your instructions in Step 2.`);
      } finally {
        setIsTesting(false);
      }
    };
    reader.onerror = () => {
        setTestError("Failed to read the test file.");
        setIsTesting(false);
    }
  };

  // Reset all relevant state for creating a new solution.
  const resetCreateFlow = async () => {
    setCurrentSolution(null);
    setSolutionId(null);
    setOutputStructureDescription("");
    setFormData({ name: "", description: "", targetUsers: "" });
    setTestFile([]);
    setTestResult(null);
    setTestError(null);
    setStep(1);
    // Don't create a draft here - wait for user to click Next on step 1
  };

  // Update solution helper function for training studio
  const updateSolution = useCallback(async (updates: Partial<Solution>) => {
    if (!solutionId) return;
    
    const result = await updateSolutionAction(solutionId, updates);
    if (result.success) {
      setCurrentSolution(result.data!);
    }
  }, [solutionId]);

  // Delete solution
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteSolution = async () => {
    if (!solutionId) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteSolutionAction(solutionId);
      
      if (result.success) {
        toast({
          title: "Solution Deleted",
          description: "Your solution has been permanently deleted.",
        });
        
        // Reset state and go back to step 1
        resetCreateFlow();
        
        // Remove edit parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        window.history.replaceState({}, '', url.toString());
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete solution",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting solution:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Refresh solution data when entering step 3
  const refreshSolutionData = useCallback(async () => {
    if (!solutionId) return;
    
    try {
      const result = await getSolutionAction(solutionId);
      if (result.success) {
        setCurrentSolution(result.data!);
        console.log('Step 3 - Refreshed solution data:', result.data);
      }
    } catch (error) {
      console.error('Failed to refresh solution data:', error);
    }
  }, [solutionId]);

  // Refresh solution data when entering step 3 to ensure latest instructions
  useEffect(() => {
    if (step === 3 && solutionId) {
      refreshSolutionData();
    }
  }, [step, solutionId, refreshSolutionData]);

  const progress = (step / 4) * 100;
  // Validate form using local state - if editing and already has output structure, don't require description
  const hasExistingOutputStructure = currentSolution?.modelOutputStructure;
  const isStep1Valid = formData.name.length > 0 && formData.description.length >= 20 && 
    (outputStructureDescription.length >= 10 || hasExistingOutputStructure);
  const isStep3Valid = testResult !== null;
  
  // Determine if this is an update or initial creation for button text
  const hasExistingData = currentSolution?.name || currentSolution?.description || currentSolution?.targetUsers;
  const step1ButtonText = hasExistingData ? "Update Solution" : "Next: Train AI";

  const handleBack = () => setStep((s) => s - 1);

  if (isLoading) {
    return (<div className="flex flex-col min-h-screen"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p>Loading Creator Studio...</p></div></main><Footer /></div>);
  }

  if (!user) {
    return (<div className="flex flex-col min-h-screen"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center max-w-md mx-auto p-6"><Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" /><h1 className="text-2xl font-bold mb-4 font-headline">Sign In Required</h1><p className="text-muted-foreground mb-6">You need to be signed in to create AI solutions.</p><Button onClick={() => setShowLoginModal(true)} className="w-full">Sign In to Create</Button></div></main><Footer /><LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} /></div>);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container px-4 md:px-6 py-8">
          <Progress value={progress} className="mb-8" />
          {step === 3 && (<Button variant="ghost" onClick={handleBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>)}
          {step === 1 && (
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-headline">
                      1. {editSolutionId ? 'Edit Your Knowledge Model' : 'Share Your Expertise'}
                    </CardTitle>
                    <CardDescription className="mt-1">Define what knowledge you want to share and how AI should structure it</CardDescription>
                  </div>
                  {editSolutionId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Solution?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{currentSolution?.name || 'this solution'}"? 
                            <br /><br />
                            This action cannot be undone. It will permanently delete:
                            <ul className="list-disc list-inside space-y-1 mt-2">
                              <li>The solution and all its settings</li>
                              <li>All training documents and examples</li>
                              <li>All ratings and usage history</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteSolution}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isDeleting ? "Deleting..." : "Delete Solution"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* FIX: Removed `|| ''` as the initial state now guarantees these fields exist. */}
                <div className="space-y-2"><Label htmlFor="solution-name">Knowledge Model Name</Label><Input id="solution-name" placeholder="e.g., Tax Receipt Analyzer, Contract Review Assistant" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} maxLength={50} required /></div>
                <div className="space-y-2"><Label htmlFor="problem-description">What knowledge are you sharing?</Label><Textarea id="problem-description" placeholder="e.g., I know how to categorize business receipts for tax filing and identify deductible expenses..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} minLength={20} maxLength={200} required /></div>
                <div className="space-y-2"><Label htmlFor="target-users">Who will benefit? (Optional)</Label><Input id="target-users" placeholder="e.g., Small business owners, freelancers, accountants" value={formData.targetUsers} onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))} maxLength={100} /></div>
                <div className="space-y-2">
                  <Label htmlFor="model-output-description">
                    What insights should the AI extract? {hasExistingOutputStructure && "(Optional - structure already exists)"}
                  </Label>
                  <Textarea 
                    id="model-output-description" 
                    placeholder="Describe what information your model should identify, e.g., 'vendor name, transaction date, total amount, expense category'" 
                    value={outputStructureDescription} 
                    onChange={(e) => setOutputStructureDescription(e.target.value)} 
                    minLength={hasExistingOutputStructure ? 0 : 10} 
                    required={!hasExistingOutputStructure} 
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasExistingOutputStructure 
                      ? "Leave blank to keep existing structure, or describe new insights to extract."
                      : "No coding required - just describe in plain language what you want to extract."
                    }
                  </p>
                </div>
                <Button onClick={handleStep1Next} disabled={!isStep1Valid || isGeneratingSchema || isCreatingDraft} className="w-full">
                  {isGeneratingSchema ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Structure...</>
                  ) : isCreatingDraft ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Solution...</>
                  ) : (
                    step1ButtonText
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
          {step === 2 && currentSolution && (
            <TrainingStudio
              solution={currentSolution}
              updateSolution={updateSolution}
              onComplete={() => setStep(s => s + 1)}
              onBack={handleBack}
            />
          )}
          {step === 3 && currentSolution && (
            <div>
              <h2 className="text-2xl font-bold mb-4 font-headline">3. Validate Your Knowledge Model</h2>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-bold mb-2">Test with a real document</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload a sample document to see how your AI model extracts insights. Maximum 30MB file size.
                    </p>
                    <FileUploader 
                      key={solutionId || 'new-solution'} 
                      onUpload={setTestFile} 
                      maxFiles={1} 
                    />
                    <Button onClick={handleRunTest} disabled={isTesting || testFile.length === 0} className="mt-4">
                      {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Run Test
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">AI-Extracted Insights</h3>
                    {isTesting ? (
                        <div className="text-center text-muted-foreground p-8">Processing...</div>
                    ) : testError ? (
                        <div className="text-destructive p-4 border border-destructive rounded-md">{testError}</div>
                    ) : testResult ? (
                        <ResultsViewer data={testResult} format="auto" />
                    ) : (
                        <div className="text-center text-muted-foreground p-8">Awaiting test...</div>
                    )}
                  </div>
                  <div className="mt-8 flex justify-end gap-2">
                    <Button variant="outline" onClick={handleBack}>Refine Model</Button>
                    <Button onClick={handlePublish} disabled={!isStep3Valid}>Publish Solution</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {step === 4 && (
            <div className="text-center max-w-xl mx-auto py-16">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                <h2 className="text-3xl font-bold mb-4 font-headline">Knowledge Model Live!</h2>
                <p className="text-muted-foreground mb-8">Your expertise is now accessible to everyone. Start earning from your knowledge.</p>
                <Card className="text-left mb-8 shadow-lg">
                    <CardHeader><CardTitle className="font-headline">{currentSolution?.name}</CardTitle><CardDescription>{currentSolution?.creator}</CardDescription></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{currentSolution?.description}</p>
                        <div className="mt-4 p-2 bg-muted rounded-md"><p className="text-sm font-mono break-all">magicbox.ai/use/{currentSolution?.slug}</p></div>
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" asChild><Link href="/">View in Marketplace</Link></Button>
                    <Button onClick={resetCreateFlow}>Create More Solutions</Button>
                    <Button
                      onClick={() => {
                        const url = `${window.location.origin}/use/${currentSolution?.slug}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: "Link copied!", description: "Share this link with others to let them use your knowledge model." });
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4"/>Share
                    </Button>
                </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Knowledge Studio...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}