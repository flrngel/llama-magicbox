import Link from "next/link";
import type { Solution } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Users } from "lucide-react";
import { RatingStatsInline } from "./rating-stats";

interface SolutionCardProps {
  solution: Solution;
}

export function SolutionCard({ solution }: SolutionCardProps) {
  // For draft solutions, make them link to the edit page instead
  const isDraft = solution.status === 'draft';
  
  const cardContent = (
    <Card className={`flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${isDraft ? 'border-orange-200' : ''}`}>
      <CardHeader>
        <CardTitle className="font-headline tracking-tight truncate">
          {solution.name || 'Untitled Solution'}
        </CardTitle>
        <CardDescription className="truncate">
          {solution.creator || (isDraft ? 'Draft solution' : 'Unknown creator')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {solution.description || 'No description yet'}
        </p>
        {isDraft && (
          <p className="text-xs text-orange-600 mt-2 font-medium">Draft - Click to continue editing</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <RatingStatsInline 
          solutionId={solution.id}
          usageCount={solution.usageCount || 0}
          rating={solution.rating || 0}
        />
      </CardFooter>
    </Card>
  );

  // Link to edit page for drafts, use page for published solutions
  const href = isDraft ? `/create?edit=${solution.id}` : `/use/${solution.slug}`;
  
  // Only wrap with Link if we have a valid destination
  if (!href || (!isDraft && !solution.slug)) {
    return cardContent;
  }

  return (
    <Link href={href}>
      {cardContent}
    </Link>
  );
}
