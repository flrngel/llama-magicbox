"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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
import { EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { unpublishSolutionAction } from "@/app/actions/solution-actions";

interface UnpublishButtonProps {
  solutionId: string;
  creatorId: string;
  solutionName: string;
}

export function UnpublishButton({ solutionId, creatorId, solutionName }: UnpublishButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  if (!user || user.id !== creatorId) {
    return null;
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const result = await unpublishSolutionAction(solutionId);
      
      if (result.success) {
        toast({
          title: "Solution Unpublished",
          description: "Your solution has been unpublished and returned to draft status.",
        });
        
        // Redirect to my solutions page
        router.push("/my-solutions");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unpublish solution",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error unpublishing solution:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <EyeOff className="w-4 h-4 mr-2" />
          Unpublish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unpublish Solution?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unpublish "{solutionName}"? 
            <br /><br />
            This will:
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Remove the solution from the public marketplace</li>
              <li>Prevent new users from accessing it</li>
              <li>Return the solution to draft status</li>
            </ul>
            <br />
            You can republish it anytime from your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnpublishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnpublish}
            disabled={isUnpublishing}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isUnpublishing ? "Unpublishing..." : "Unpublish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}