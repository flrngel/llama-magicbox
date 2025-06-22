"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Bot, User, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { refineSolution } from "@/ai/flows/refine-solution-flow";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Solution } from "@/lib/data";

export interface Message {
  sender: "user" | "ai";
  text: string;
}

interface ChatTrainerProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  solution: Partial<Solution>;
  updateSolution: (updates: Partial<Solution>) => void;
}

export function ChatTrainer({ messages, setMessages, solution, updateSolution }: ChatTrainerProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { sender: "ai", text: "I've analyzed your documents. What should I focus on? For example, tell me to 'extract the total amount and vendor name from these receipts'." },
      ]);
    }
  }, [messages, setMessages]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages])

  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const trainingContext = newMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
      const response = await refineSolution({
          currentInstructions: solution.systemInstructions,
          userInput: input,
          trainingContext: trainingContext,
          modelOutputStructure: solution.modelOutputStructure ?? 'No structure defined yet.',
      });

      if (response) {
          updateSolution({ systemInstructions: response.updatedSystemInstructions });
          const aiResponse: Message = { sender: "ai", text: response.aiResponse };
          setMessages((prev) => [...prev, aiResponse]);
      } else {
          throw new Error("AI did not return a valid response.");
      }

    } catch (error) {
      console.error("Error refining solution:", error);
      const errorResponse: Message = { sender: "ai", text: "Sorry, I had trouble processing that. Could you try again?" };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[500px] rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
      <div ref={scrollAreaRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === "ai" && (
              <Avatar className="w-8 h-8">
                <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm transition-all duration-200",
                message.sender === "user"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md"
              )}
            >
              <p>{message.text}</p>
            </div>
             {message.sender === "user" && (
              <Avatar className="w-8 h-8">
                <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                 <Avatar className="w-8 h-8">
                    <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="relative">
          <Textarea
            placeholder="Type your training instructions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pr-16 min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute bottom-3 right-3 h-10 w-10 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleSend}
            disabled={isLoading || input.trim() === ""}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}