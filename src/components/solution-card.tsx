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
    <Card className={`group flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer relative ${isDraft ? 'border-orange-300 border-2' : ''}`}>
      {!isDraft && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      )}
      <CardHeader className="relative">
        <CardTitle className="font-semibold text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent truncate">
          {solution.name || 'Untitled Solution'}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400 truncate">
          by {solution.creator || (isDraft ? 'Draft solution' : 'Unknown creator')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow relative">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
          {solution.description || 'No description yet'}
        </p>
        {isDraft && (
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
        )}
        {isDraft && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-3 font-semibold relative">Draft - Click to continue editing</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center relative pt-4 border-t border-gray-100 dark:border-gray-800">
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
