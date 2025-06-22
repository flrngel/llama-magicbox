"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Star, Users } from "lucide-react";
import { getRatingStatsAction } from "@/app/actions/rating-actions";
import { RatingsModal } from "./ratings-modal";

interface RatingStatsProps {
  solutionId: string;
  usageCount: number;
  className?: string;
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number };
}

export function RatingStats({ solutionId, usageCount, className }: RatingStatsProps) {
  const [stats, setStats] = useState<RatingStats>({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, [solutionId]);

  const loadStats = async () => {
    try {
      const result = await getRatingStatsAction(solutionId);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <div className="h-4 w-4 animate-pulse bg-muted rounded"></div>
        <span>Loading...</span>
      </div>
    );
  }

  const hasRatings = stats.totalRatings > 0;

  return (
    <>
      <Button
        variant="ghost"
        className={`h-auto p-0 hover:bg-transparent ${className}`}
        onClick={() => setShowModal(true)}
        disabled={!hasRatings}
      >
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Used {usageCount} time{usageCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className={`w-4 h-4 ${hasRatings ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            <span>
              {hasRatings ? (
                <>
                  {stats.averageRating.toFixed(1)} ({stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''})
                </>
              ) : (
                'No ratings yet'
              )}
            </span>
          </div>
        </div>
      </Button>

      <RatingsModal
        solutionId={solutionId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        stats={stats}
      />
    </>
  );
}

// Simple inline version for solution cards
export function RatingStatsInline({ solutionId, usageCount, rating }: { 
  solutionId: string; 
  usageCount: number; 
  rating: number; 
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{usageCount || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <Star className={`w-4 h-4 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        <span>{rating > 0 ? rating.toFixed(1) : '0'}</span>
      </div>
    </div>
  );
}