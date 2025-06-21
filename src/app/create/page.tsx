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
  
  const [newSolution, setNewSolution] = useState<Partial<Solution>>(getInitialSolutionState());
  const [outputStructureDescription, setOutputStructureDescription] = useState("");
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);


  // State for Test Step
  const [testFile, setTestFile] = useState<File[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // FIX: Memoize updateSolution to prevent re-renders in child components.
  const updateSolution = useCallback((updates: Partial<Solution>) => {
    setNewSolution(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginModal(true);
    }
    // Hydrate user-specific data once authentication is loaded and if it's not already present.
    if (!isLoading && user && !newSolution.creatorId) {
      updateSolution({
        creatorId: user.id,
        creator: `by ${user.name}`,
      });
    }
  }, [user, isLoading, newSolution.creatorId, updateSolution]);


  const handlePublish = async () => {
    try {
      const finalSolutionData = {
        name: newSolution.name!,
        description: newSolution.description!,
        problemDescription: newSolution.description!,
        targetUsers: newSolution.targetUsers!,
        creatorId: newSolution.creatorId!,
        creator: newSolution.creator!,
        category: (newSolution.category || 'Personal Organization') as Solution['category'],
        systemInstructions: newSolution.systemInstructions!,
        modelOutputStructure: newSolution.modelOutputStructure!,
      };
      
      const published = await createSolution({
        solutionData: finalSolutionData,
        dataItemsData: [], // Training data is now handled internally by TrainingStudio
      });
      
      updateSolution({ slug: published.slug }); // save slug for final page
      toast({ title: "Solution Published!", description: `${newSolution.name} is now live.` });
      setStep(s => s + 1);
    } catch (error) {
      console.error('Error publishing solution:', error);
      toast({ title: "Publication Failed", description: "Failed to publish solution. Please try again.", variant: "destructive" });
    }
  };
  
  const handleStep1Next = async () => {
    if (!isStep1Valid) {
      return;
    }
    
    setIsGeneratingSchema(true);
    try {
        const result = await generateOutputSchema({ description: outputStructureDescription });
        if (result && result.schema) {
            updateSolution({ modelOutputStructure: result.schema });
            toast({ title: "Output Structure Generated", description: "The AI has created a data schema." });
            setStep(s => s + 1);
        } else { throw new Error("Failed to generate schema from AI."); }
    } catch (error) {
        console.error("Error generating schema:", error);
        toast({ title: "Schema Generation Failed", description: "Please try rephrasing your description.", variant: "destructive" });
    } finally { setIsGeneratingSchema(false); }
  };

  const handleRunTest = async () => {
    if (testFile.length === 0) return;
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    const file = testFile[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const fileDataUri = reader.result as string;
      try {
        const result = await processDocument({
          fileDataUri: fileDataUri,
          systemInstructions: newSolution.systemInstructions!,
          modelOutputStructure: newSolution.modelOutputStructure!,
        });
        setTestResult(result);
      } catch (e) {
        setTestError("The AI failed to process this document. You may need to refine your instructions in Step 2.");
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
  const resetCreateFlow = () => {
    setNewSolution(getInitialSolutionState());
    setOutputStructureDescription("");
    setTestFile([]);
    setTestResult(null);
    setTestError(null);
    setStep(1);
    // Re-hydrate with user info for the new solution
    if (user) {
        updateSolution({
            creatorId: user.id,
            creator: `by ${user.name}`,
        });
    }
  };

  const progress = (step / 4) * 100;
  const isStep1Valid = (newSolution.name?.length ?? 0) > 0 && (newSolution.description?.length ?? 0) >= 20 && outputStructureDescription.length > 10;
  const isStep3Valid = testResult !== null;

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
        <div className="container mx-auto max-w-4xl py-12 px-4">
          <Progress value={progress} className="mb-8" />
          {step > 1 && step < 4 && (<Button variant="ghost" onClick={handleBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>)}
          {step === 1 && (
            <Card className="max-w-xl mx-auto">
              <CardHeader><CardTitle className="font-headline">1. Define Your Solution</CardTitle><CardDescription>What problem will your AI solve and what is the desired output?</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {/* FIX: Removed `|| ''` as the initial state now guarantees these fields exist. */}
                <div className="space-y-2"><Label htmlFor="solution-name">Solution Name</Label><Input id="solution-name" placeholder="e.g., Tax Receipt Organizer" value={newSolution.name} onChange={(e) => updateSolution({ name: e.target.value })} maxLength={50} required /></div>
                <div className="space-y-2"><Label htmlFor="problem-description">Problem Description</Label><Textarea id="problem-description" placeholder="e.g., Categorize business receipts for tax filing..." value={newSolution.description} onChange={(e) => updateSolution({ description: e.target.value })} minLength={20} maxLength={200} required /></div>
                <div className="space-y-2"><Label htmlFor="target-users">Target Users (Optional)</Label><Input id="target-users" placeholder="e.g., Small business owners, freelancers" value={newSolution.targetUsers} onChange={(e) => updateSolution({ targetUsers: e.target.value })} maxLength={100} /></div>
                <div className="space-y-2"><Label htmlFor="model-output-description">Desired Output Fields</Label><Textarea id="model-output-description" placeholder="Describe the fields you want the AI to extract, e.g., 'vendor name, transaction date, total amount'" value={outputStructureDescription} onChange={(e) => setOutputStructureDescription(e.target.value)} minLength={10} required /><p className="text-xs text-muted-foreground">The AI will generate a technical format based on your description.</p></div>
                <Button onClick={handleStep1Next} disabled={!isStep1Valid || isGeneratingSchema} className="w-full">{isGeneratingSchema ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Structure...</>) : ("Next: Train AI")}</Button>
              </CardContent>
            </Card>
          )}
          {step === 2 && (
            <TrainingStudio
              solution={newSolution}
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
                    <CardHeader><CardTitle className="font-headline">{newSolution.name}</CardTitle><CardDescription>{newSolution.creator}</CardDescription></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{newSolution.description}</p>
                        <div className="mt-4 p-2 bg-muted rounded-md"><p className="text-sm font-mono break-all">magicbox.ai/use/{newSolution.slug}</p></div>
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