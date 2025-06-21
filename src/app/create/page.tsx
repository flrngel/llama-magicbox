"use client";

import { useState, useEffect } from "react";
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
import { ChatTrainer, Message } from "@/components/chat-trainer";
import { ResultsViewer } from "@/components/results-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Share2, Sparkles, Lock } from "lucide-react";

export default function CreatePage() {
  const { user, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [step, setStep] = useState(1);
  const [solutionName, setSolutionName] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginModal(true);
    }
  }, [user, isLoading]);

  const progress = (step / 4) * 100;
  
  const isStep1Valid = solutionName.length > 0 && problemDescription.length >= 20;
  const isStep2Valid = chatMessages.filter(m => m.sender === 'user').length >= 2;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4 font-headline">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to create AI solutions. Join our community of creators!
            </p>
            <Button onClick={() => setShowLoginModal(true)} className="w-full">
              Sign In to Create
            </Button>
          </div>
        </main>
        <Footer />
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4">
          <Progress value={progress} className="mb-8" />

          {step > 1 && step < 4 && (
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}

          {step === 1 && (
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle className="font-headline">1. Define Your Solution</CardTitle>
                <CardDescription>What problem will your AI solve?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="solution-name">Solution Name</Label>
                  <Input id="solution-name" placeholder="e.g., Tax Receipt Organizer" value={solutionName} onChange={(e) => setSolutionName(e.target.value)} maxLength={50} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="problem-description">Problem Description</Label>
                  <Textarea id="problem-description" placeholder="e.g., Categorize business receipts for tax filing by extracting vendor, date, and amount." value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} minLength={20} maxLength={200} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="target-users">Target Users (Optional)</Label>
                  <Input id="target-users" placeholder="e.g., Small business owners, freelancers" value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} maxLength={100} />
                </div>
                <Button onClick={handleNext} disabled={!isStep1Valid} className="w-full">
                  Next: Train AI
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 font-headline">2. Train with Documents</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-bold">Upload Example Documents</h3>
                    <FileUploader onUpload={setUploadedFiles} maxFiles={10} multiple />
                </div>
                <div>
                    <h3 className="font-bold">Train the AI</h3>
                    <ChatTrainer messages={chatMessages} setMessages={setChatMessages} />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={handleNext} disabled={!isStep2Valid}>
                  Test Solution <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 font-headline">3. Test Your Solution</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold mb-2">Upload a test document</h3>
                      <FileUploader onUpload={() => {}} maxFiles={1} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Results Preview</h3>
                      <ResultsViewer data={{ "Status": "Awaiting test document...", "Confidence": "N/A" }} format="table" />
                       <div className="mt-2 text-sm text-muted-foreground">Confidence Score: <strong>78%</strong></div>
                    </div>
                  </div>
                   <div className="mt-8 flex justify-end gap-2">
                     <Button variant="outline" onClick={handleBack}>Refine Training</Button>
                     <Button onClick={handleNext}>Publish Solution</Button>
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
                    <CardHeader>
                        <CardTitle className="font-headline">{solutionName}</CardTitle>
                        <CardDescription>by {user.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{problemDescription}</p>
                        <div className="mt-4 p-2 bg-muted rounded-md">
                            <p className="text-sm font-mono break-all">
                                magicbox.ai/use/{solutionName.toLowerCase().replace(/\s+/g, '-')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" asChild>
                      <Link href="/browse">View in Marketplace</Link>
                    </Button>
                    <Button onClick={() => setStep(1)}>Create Another</Button>
                    <Button>
                        <Share2 className="mr-2 h-4 w-4"/>
                        Share
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