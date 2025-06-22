"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { Star, User, Calendar, MessageSquare } from "lucide-react";
import { getRatingsBySolution } from "@/lib/data";
import { Rating } from "@/lib/data";

interface RatingsModalProps {
  solutionId: string;
  isOpen: boolean;
  onClose: () => void;
  stats: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { [key: number]: number };
  };
}

export function RatingsModal({ solutionId, isOpen, onClose, stats }: RatingsModalProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRatings();
    }
  }, [isOpen, solutionId]);

  const loadRatings = async () => {
    setIsLoading(true);
    try {
      // Note: In a real app, we'd fetch this through an API action
      // For now, we'll create a client action
      const response = await fetch(`/api/ratings/${solutionId}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return "Excellent";
      case 4: return "Good";
      case 3: return "Average";
      case 2: return "Poor";
      case 1: return "Terrible";
      default: return "";
    }
  };

  const getInitials = (userId: string) => {
    // Generate consistent initials from user ID
    const chars = userId.split('').filter(c => /[a-zA-Z0-9]/.test(c));
    return chars.length >= 2 ? `${chars[0]}${chars[1]}`.toUpperCase() : 'U';
  };

  const generateUserName = (userId: string) => {
    // Generate consistent anonymous username from user ID
    const adjectives = ['Happy', 'Swift', 'Bright', 'Cool', 'Smart', 'Quick', 'Wise', 'Kind'];
    const animals = ['Panda', 'Eagle', 'Fox', 'Wolf', 'Cat', 'Owl', 'Bear', 'Deer'];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const adjIndex = Math.abs(hash) % adjectives.length;
    const animalIndex = Math.abs(hash >> 8) % animals.length;
    const number = Math.abs(hash >> 16) % 100;
    
    return `${adjectives[adjIndex]}${animals[animalIndex]}${number}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            Ratings & Reviews
          </DialogTitle>
          <DialogDescription>
            User feedback and ratings for this solution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Statistics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(stats.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex-1 ml-8 space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{rating}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Individual Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Individual Reviews</h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading reviews...
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No detailed reviews yet.</p>
                <p className="text-xs">Be the first to leave feedback!</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {ratings
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((rating) => (
                    <div key={rating.id} className="border rounded-lg p-4 space-y-3">
                      {/* Rating Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {getInitials(rating.userId)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {generateUserName(rating.userId)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {rating.rating}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getRatingLabel(rating.rating)}
                          </span>
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Comment */}
                      {rating.comment && (
                        <div className="bg-muted/30 rounded-md p-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {rating.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}