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

interface SolutionCardProps {
  solution: Solution;
}

export function SolutionCard({ solution }: SolutionCardProps) {
  return (
    <Link href={`/use/${solution.slug}`}>
      <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
        <CardHeader>
          <CardTitle className="font-headline tracking-tight truncate">{solution.name}</CardTitle>
          <CardDescription className="truncate">{solution.creator}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{solution.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{solution.usageCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{solution.rating}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
