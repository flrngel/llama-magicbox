"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ArrowLeft, CheckCircle, Share2, Sparkles, Lock, Loader2 } from "lucide-react";
import { Solution } from "@/lib/data";
import { createSolution } from "@/lib/data-client";
import { useToast } from "@/hooks/use-toast";
import { generateOutputSchema } from "@/ai/flows/generate-output-schema";
import { processDocument } from "@/ai/flows/process-document-flow";
import { 
  createDraftSolution, 
  updateSolutionAction, 
  getSolutionAction,
  publishSolutionAction 
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

export default function CreatePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
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

  // Create draft solution when user is authenticated
  const createDraftWhenReady = useCallback(async () => {
    if (!user || solutionId || isCreatingDraft) return;
    
    setIsCreatingDraft(true);
    try {
      // First ensure user exists in database
      const userResult = await createOrGetUser(user);
      if (!userResult.success) {
        toast({ title: "Error", description: "Failed to create user record", variant: "destructive" });
        return;
      }
      
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
          // Load existing data into form if available
          setFormData({
            name: solutionResult.data!.name || "",
            description: solutionResult.data!.description || "",
            targetUsers: solutionResult.data!.targetUsers || ""
          });
        }
      } else {
        toast({ title: "Error", description: "Failed to create draft solution", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error creating draft:', error);
      toast({ title: "Error", description: "Failed to create draft solution", variant: "destructive" });
    } finally {
      setIsCreatingDraft(false);
    }
  }, [user, solutionId, isCreatingDraft, toast]);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginModal(true);
    } else if (!isLoading && user && !solutionId) {
      createDraftWhenReady();
    }
  }, [user, isLoading, solutionId, createDraftWhenReady]);

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
        creator: `by ${user!.name}`,
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
    if (!isStep1Valid || !solutionId) {
      return;
    }
    
    setIsGeneratingSchema(true);
    try {
        // First update solution with local form data
        await updateSolutionAction(solutionId, {
          name: formData.name,
          description: formData.description,
          targetUsers: formData.targetUsers
        });
        
        // Generate schema
        const result = await generateOutputSchema({ description: outputStructureDescription });
        if (result && result.schema) {
            await updateSolutionAction(solutionId, { modelOutputStructure: result.schema });
            
            // Reload solution
            const updatedResult = await getSolutionAction(solutionId);
            if (updatedResult.success) {
              setCurrentSolution(updatedResult.data!);
            }
            
            toast({ title: "Output Structure Generated", description: "The AI has created a data schema." });
            setStep(s => s + 1);
        } else { throw new Error("Failed to generate schema from AI."); }
    } catch (error) {
        console.error("Error generating schema:", error);
        toast({ title: "Schema Generation Failed", description: "Please try rephrasing your description.", variant: "destructive" });
    } finally { setIsGeneratingSchema(false); }
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
    // Create new draft solution
    if (user) {
      await createDraftWhenReady();
    }
  };

  // Update solution helper function for training studio
  const updateSolution = useCallback(async (updates: Partial<Solution>) => {
    if (!solutionId) return;
    
    const result = await updateSolutionAction(solutionId, updates);
    if (result.success) {
      setCurrentSolution(result.data!);
    }
  }, [solutionId]);

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
  // Validate form using local state
  const isStep1Valid = formData.name.length > 0 && formData.description.length >= 20 && outputStructureDescription.length > 10 && currentSolution !== null;
  const isStep3Valid = testResult !== null;
  
  // Determine if this is an update or initial creation for button text
  const hasExistingData = currentSolution?.name || currentSolution?.description || currentSolution?.targetUsers;
  const step1ButtonText = hasExistingData ? "Update Solution" : "Next: Train AI";

  const handleBack = () => setStep((s) => s - 1);

  if (isLoading || isCreatingDraft) {
    return (<div className="flex flex-col min-h-screen"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p>{isLoading ? 'Loading Creator Studio...' : 'Creating draft solution...'}</p></div></main><Footer /></div>);
  }

  if (!user) {
    return (<div className="flex flex-col min-h-screen"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center max-w-md mx-auto p-6"><Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" /><h1 className="text-2xl font-bold mb-4 font-headline">Sign In Required</h1><p className="text-muted-foreground mb-6">You need to be signed in to create AI solutions.</p><Button onClick={() => setShowLoginModal(true)} className="w-full">Sign In to Create</Button></div></main><Footer /><LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} /></div>);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4">
          <Progress value={progress} className="mb-8" />
          {step > 1 && step < 4 && (<Button variant="ghost" onClick={handleBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>)}
          {step === 1 && (
            <Card className="max-w-xl mx-auto">
              <CardHeader><CardTitle className="font-headline">1. Define Your Solution</CardTitle><CardDescription>What problem will your AI solve and what is the desired output?</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {/* FIX: Removed `|| ''` as the initial state now guarantees these fields exist. */}
                <div className="space-y-2"><Label htmlFor="solution-name">Solution Name</Label><Input id="solution-name" placeholder="e.g., Tax Receipt Organizer" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} maxLength={50} required /></div>
                <div className="space-y-2"><Label htmlFor="problem-description">Problem Description</Label><Textarea id="problem-description" placeholder="e.g., Categorize business receipts for tax filing..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} minLength={20} maxLength={200} required /></div>
                <div className="space-y-2"><Label htmlFor="target-users">Target Users (Optional)</Label><Input id="target-users" placeholder="e.g., Small business owners, freelancers" value={formData.targetUsers} onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))} maxLength={100} /></div>
                <div className="space-y-2"><Label htmlFor="model-output-description">Desired Output Fields</Label><Textarea id="model-output-description" placeholder="Describe the fields you want the AI to extract, e.g., 'vendor name, transaction date, total amount'" value={outputStructureDescription} onChange={(e) => setOutputStructureDescription(e.target.value)} minLength={10} required /><p className="text-xs text-muted-foreground">The AI will generate a technical format based on your description.</p></div>
                <Button onClick={handleStep1Next} disabled={!isStep1Valid || isGeneratingSchema} className="w-full">{isGeneratingSchema ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Structure...</>) : step1ButtonText}</Button>
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
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 font-headline">3. Test Your Solution</h2>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-bold mb-2">Upload a test document</h3>
                    <FileUploader onUpload={setTestFile} maxFiles={1} />
                    <Button onClick={handleRunTest} disabled={isTesting || testFile.length === 0} className="mt-4">
                      {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Run Test
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Results Preview</h3>
                    {isTesting ? (
                        <div className="text-center text-muted-foreground p-8">Processing...</div>
                    ) : testError ? (
                        <div className="text-destructive p-4 border border-destructive rounded-md">{testError}</div>
                    ) : testResult ? (
                        <ResultsViewer data={testResult} format="table" />
                    ) : (
                        <div className="text-center text-muted-foreground p-8">Awaiting test...</div>
                    )}
                  </div>
                  <div className="mt-8 flex justify-end gap-2">
                    <Button variant="outline" onClick={handleBack}>Refine Training</Button>
                    <Button onClick={handlePublish} disabled={!isStep3Valid}>Publish Solution</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {step === 4 && (
            <div className="text-center max-w-xl mx-auto py-16">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                <h2 className="text-3xl font-bold mb-4 font-headline">Solution Published!</h2>
                <p className="text-muted-foreground mb-8">Your solution is now live and available in the marketplace.</p>
                <Card className="text-left mb-8 shadow-lg">
                    <CardHeader><CardTitle className="font-headline">{currentSolution?.name}</CardTitle><CardDescription>{currentSolution?.creator}</CardDescription></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{currentSolution?.description}</p>
                        <div className="mt-4 p-2 bg-muted rounded-md"><p className="text-sm font-mono break-all">magicbox.ai/use/{currentSolution?.slug}</p></div>
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" asChild><Link href="/">View in Marketplace</Link></Button>
                    <Button onClick={resetCreateFlow}>Create Another</Button>
                    <Button><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}