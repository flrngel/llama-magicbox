"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Bot, 
  User, 
  Send, 
  CheckCircle, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown,
  FileText,
  Sparkles,
  Code,
  Eye
} from "lucide-react";
import { TrainingDocument } from "./training-studio";
import { Solution } from "@/lib/data";
import { processDocument } from "@/ai/flows/process-document-flow";
import { refineSolution } from "@/ai/flows/refine-solution-flow";
import { useToast } from "@/hooks/use-toast";
import { ResultsViewer } from "./results-viewer";
import { cn } from "@/lib/utils";

interface TrainingSessionProps {
  document: TrainingDocument;
  solution: Solution;
  updateSolution: (updates: Partial<Solution>) => Promise<void>;
  onDocumentUpdate: (document: TrainingDocument) => void;
}

// Component to format AI messages in a user-friendly way
function MessageContent({ message, sender }: { message: string; sender: 'user' | 'ai' }) {
  if (sender === 'user') {
    return <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message}</p>;
  }

  // Check if message contains JSON output (objects or arrays)
  const jsonMatch = message.match(/Here's what I extracted:\s*([\[{][\s\S]*?[\]}])\./);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      const beforeJson = message.substring(0, message.indexOf(jsonMatch[0]));
      const afterJson = message.substring(message.indexOf(jsonMatch[0]) + jsonMatch[0].length);
      
      return (
        <div className="space-y-2">
          <p className="whitespace-pre-wrap break-words">{beforeJson}Here's what I extracted:</p>
          <div className="bg-background/50 rounded-md p-2 border">
            <ResultsViewer data={jsonData} format="auto" />
          </div>
          <p className="whitespace-pre-wrap break-words">{afterJson}</p>
        </div>
      );
    } catch (e) {
      // If JSON parsing fails, show original message
    }
  }

  // Check if message contains "Output:" followed by JSON (objects or arrays)
  const outputMatch = message.match(/Output:\s*([\[{][\s\S]*[\]}])$/);
  if (outputMatch) {
    try {
      const jsonData = JSON.parse(outputMatch[1]);
      const beforeOutput = message.substring(0, message.indexOf(outputMatch[0]));
      
      return (
        <div className="space-y-2">
          {beforeOutput && <p className="whitespace-pre-wrap break-words">{beforeOutput}</p>}
          <p className="font-medium">Output:</p>
          <div className="bg-background/50 rounded-md p-2 border">
            <ResultsViewer data={jsonData} format="auto" />
          </div>
        </div>
      );
    } catch (e) {
      // If JSON parsing fails, show original message
    }
  }

  // Default: show message as-is
  return <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message}</p>;
}

export function TrainingSession({ 
  document, 
  solution, 
  updateSolution, 
  onDocumentUpdate 
}: TrainingSessionProps) {
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when chat history changes
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [document.chatHistory]);

  const handleReprocess = async () => {
    setIsProcessing(true);
    setIsAiTyping(true);
    try {
      // Always use the latest instructions from the solution state
      console.log('TrainingSession re-processing with solution.systemInstructions:', solution.systemInstructions);
      const result = await processDocument({
        fileDataUri: document.dataUri,
        systemInstructions: solution.systemInstructions || "Extract information from this document.",
        modelOutputStructure: solution.modelOutputStructure || "z.object({})",
      });

      const confidence = calculateConfidence(result);
      const updatedDocument: TrainingDocument = {
        ...document,
        status: 'ready',
        aiOutput: result,
        confidence,
        chatHistory: [
          ...document.chatHistory,
          {
            sender: 'ai',
            message: `I've re-processed the document with the updated instructions. Check the output above to see if it's better now.`,
            timestamp: new Date()
          }
        ]
      };

      onDocumentUpdate(updatedDocument);
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast({ 
        title: "Processing Error", 
        description: "Failed to re-process the document.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsAiTyping(false);
    }
  };

  const handleApprove = () => {
    const updatedDocument: TrainingDocument = {
      ...document,
      status: 'approved',
      chatHistory: [
        ...document.chatHistory,
        {
          sender: 'user',
          message: "✅ Approved this output",
          timestamp: new Date()
        },
        {
          sender: 'ai',
          message: "Great! I've learned from this example and will apply this understanding to future documents.",
          timestamp: new Date()
        }
      ]
    };

    onDocumentUpdate(updatedDocument);
  };

  const handleNeedsWork = () => {
    const updatedDocument: TrainingDocument = {
      ...document,
      status: 'needs_work',
      chatHistory: [
        ...document.chatHistory,
        {
          sender: 'user',
          message: "❌ This needs improvement",
          timestamp: new Date()
        },
        {
          sender: 'ai',
          message: "I understand this output needs improvement. Please tell me what I should change or what I missed.",
          timestamp: new Date()
        }
      ]
    };

    onDocumentUpdate(updatedDocument);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMessage = {
      sender: 'user' as const,
      message: chatInput.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    const updatedWithUserMessage = {
      ...document,
      chatHistory: [...document.chatHistory, userMessage]
    };
    onDocumentUpdate(updatedWithUserMessage);
    setChatInput("");
    setIsChatting(true);
    setIsAiTyping(true);

    try {
      // Get AI response and updated instructions
      const trainingContext = updatedWithUserMessage.chatHistory
        .map(msg => `${msg.sender}: ${msg.message}`)
        .join('\n');

      const refinementResult = await refineSolution({
        currentInstructions: solution.systemInstructions || "",
        userInput: userMessage.message,
        trainingContext,
        modelOutputStructure: solution.modelOutputStructure || "z.object({})",
      });

      if (refinementResult) {
        const newInstructions = refinementResult.updatedSystemInstructions;
        const shouldUserFollow = refinementResult.shouldUserFollow;
        
        console.log('TrainingSession refinement result:', {
          shouldUserFollow,
          previousInstructions: solution.systemInstructions,
          newInstructions,
          aiResponse: refinementResult.aiResponse
        });

        // Add AI response first
        const aiMessage = {
          sender: 'ai' as const,
          message: refinementResult.aiResponse,
          timestamp: new Date()
        };

        if (shouldUserFollow) {
          // AI is asking for clarification - don't update instructions yet
          console.log('AI is asking follow-up questions - not updating instructions');
          
          const followUpDocument = {
            ...updatedWithUserMessage,
            chatHistory: [...updatedWithUserMessage.chatHistory, aiMessage]
          };
          
          onDocumentUpdate(followUpDocument);
          setIsAiTyping(false);
        } else {
          // User feedback was clear - update instructions and reprocess
          console.log('Updating solution with new instructions:', newInstructions);
          await updateSolution({ 
            systemInstructions: newInstructions 
          });

          // Force reprocess with new instructions to immediately show the effect
          setTimeout(async () => {
            try {
              const reprocessResult = await processDocument({
                fileDataUri: document.dataUri,
                systemInstructions: newInstructions,
                modelOutputStructure: solution.modelOutputStructure || "z.object({})",
              });

              const confidence = calculateConfidence(reprocessResult);
              const reprocessedDocument: TrainingDocument = {
                ...updatedWithUserMessage,
                status: 'ready',
                aiOutput: reprocessResult,
                confidence,
                chatHistory: [
                  ...updatedWithUserMessage.chatHistory,
                  aiMessage,
                  {
                    sender: 'ai',
                    message: `I've updated my understanding and reprocessed the document. Please check if the output is better now.`,
                    timestamp: new Date()
                  }
                ]
              };

              onDocumentUpdate(reprocessedDocument);
              setIsAiTyping(false);
            } catch (error) {
              console.error('Error reprocessing with new instructions:', error);
              // If reprocessing fails, at least show the chat response
              const fallbackDocument = {
                ...updatedWithUserMessage,
                chatHistory: [...updatedWithUserMessage.chatHistory, aiMessage]
              };
              onDocumentUpdate(fallbackDocument);
              setIsAiTyping(false);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = {
        sender: 'ai' as const,
        message: "I had trouble understanding that. Could you try rephrasing your feedback?",
        timestamp: new Date()
      };

      const errorDocument = {
        ...updatedWithUserMessage,
        chatHistory: [...updatedWithUserMessage.chatHistory, errorMessage]
      };

      onDocumentUpdate(errorDocument);
      setIsAiTyping(false);
    } finally {
      setIsChatting(false);
    }
  };

  const calculateConfidence = (aiOutput: any): number => {
    if (!aiOutput || typeof aiOutput !== 'object') return 0;
    const fields = Object.values(aiOutput);
    const filledFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    );
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'ready':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ready for Review</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'needs_work':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Needs Work</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{document.file.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge()}
                  {document.confidence && (
                    <span className="text-sm text-muted-foreground">
                      {document.confidence}% confident
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleReprocess}
              disabled={isProcessing || document.status === 'processing'}
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Re-process
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Document Preview & AI Output */}
        <div className="space-y-4">
          {/* Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                {document.file.type.startsWith('image/') ? (
                  <img 
                    src={document.dataUri} 
                    alt={document.file.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{document.file.name}</p>
                    <p className="text-xs">Preview not available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Output */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">AI Output</CardTitle>
                {document.status === 'ready' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApprove}
                      className="text-green-600 hover:text-green-700"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNeedsWork}
                      className="text-red-600 hover:text-red-700"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Needs Work
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {document.status === 'processing' ? (
                <div className="text-center text-muted-foreground py-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <p>AI is processing...</p>
                </div>
              ) : document.aiOutput ? (
                <Tabs defaultValue="formatted" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="formatted" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Formatted
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Raw JSON
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="formatted" className="mt-4">
                    <div className="max-h-60 overflow-auto">
                      <ResultsViewer data={document.aiOutput} format="auto" />
                    </div>
                  </TabsContent>
                  <TabsContent value="raw" className="mt-4">
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-60">
                      {JSON.stringify(document.aiOutput, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No output available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Training Chat */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Training Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Chat Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 min-h-0">
              <div className="space-y-4 overflow-hidden">
                {document.chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[calc(100%-3rem)] min-w-0 rounded-lg p-3 text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <MessageContent message={msg.message} sender={msg.sender} />
                      <span className="text-xs opacity-70 mt-1 block">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {msg.sender === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isAiTyping && (
                  <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback>
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[calc(100%-3rem)] min-w-0 bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            {/* Chat Input */}
            <div className="p-4">
              <div className="relative">
                <Textarea
                  placeholder="Tell me what to improve or what I missed..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="pr-12 min-h-[60px]"
                  disabled={isChatting}
                />
                <Button
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleSendMessage}
                  disabled={isChatting || !chatInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}