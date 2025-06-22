"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Star, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { submitRatingAction, getUserRatingAction } from "@/app/actions/rating-actions";
import { useToast } from "@/hooks/use-toast";
import { Rating } from "@/lib/data";

interface SolutionRatingProps {
  solutionId: string;
  solutionName: string;
  creatorId: string;
  onRatingSubmitted?: (rating: Rating) => void;
}

export function SolutionRating({ solutionId, solutionName, creatorId, onRatingSubmitted }: SolutionRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing rating when component mounts
  useEffect(() => {
    if (user) {
      loadExistingRating();
    } else {
      setIsLoading(false);
    }
  }, [user, solutionId]);

  const loadExistingRating = async () => {
    if (!user) return;
    
    try {
      const result = await getUserRatingAction(user.id, solutionId);
      if (result.success && result.data) {
        setExistingRating(result.data);
        setRating(result.data.rating);
        setComment(result.data.comment || "");
      }
    } catch (error) {
      console.error('Error loading existing rating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      const result = await submitRatingAction(solutionId, user.id, rating, comment.trim() || undefined);
      
      if (result.success) {
        toast({
          title: existingRating ? "Rating Updated" : "Rating Submitted",
          description: `Thank you for rating ${solutionName}!`
        });
        
        if ('data' in result) {
          setExistingRating(result.data);
          onRatingSubmitted?.(result.data);
        }
      } else {
        toast({
          title: "Rating Failed",
          description: 'error' in result ? result.error : 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Rating Failed",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Don't show rating for non-authenticated users
  }

  // Don't show rating for solution creators
  if (user.id === creatorId) {
    return null; // Users cannot rate their own solutions
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {existingRating ? "Update Your Rating" : "Rate This Solution"}
        </CardTitle>
        <CardDescription>
          {existingRating 
            ? "You can update your rating and feedback below."
            : "Help other users by sharing your experience with this solution."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 hover:scale-110 transition-transform"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                disabled={isSubmitting}
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating > 0 && (
                <>
                  {rating} star{rating !== 1 ? 's' : ''} - {
                    rating === 5 ? "Excellent" :
                    rating === 4 ? "Good" :
                    rating === 3 ? "Average" :
                    rating === 2 ? "Poor" : "Terrible"
                  }
                </>
              )}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Comment (Optional)</label>
          <Textarea
            placeholder="Tell us about your experience with this solution..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {existingRating ? "Updating..." : "Submitting..."}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {existingRating ? "Update Rating" : "Submit Rating"}
            </>
          )}
        </Button>

        {existingRating && (
          <p className="text-xs text-muted-foreground text-center">
            Previously rated on {existingRating.createdAt.toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}