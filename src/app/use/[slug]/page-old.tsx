"use client";

import { useState, useEffect, use } from "react";
import { fetchSolutionBySlug } from "@/lib/data-client";
import { Solution } from "@/lib/data";
import { notFound as nextNotFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth";
import { UseSolutionForm } from "./_components/use-solution-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Edit, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RatingStats } from "@/components/rating-stats";

export default function UseSolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  useEffect(() => {
    async function loadSolution() {
      try {
        const data = await fetchSolutionBySlug(resolvedParams.slug);
        setSolution(data);
      } catch (error) {
        console.error('Failed to load solution:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadSolution();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading knowledge model...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !solution) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Knowledge Model Not Found</h1>
            <p className="text-muted-foreground mb-4">The knowledge model you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/">Back to Marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Marketplace
                </Link>
            </Button>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                    {solution.name}
                  </h1>
                  <p className="text-muted-foreground md:text-xl/relaxed mt-4">
                    {solution.problemDescription}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">Knowledge shared {solution.creator}</p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <RatingStats solutionId={solution.id} usageCount={solution.usageCount} />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/use/${solution.slug}`;
                        navigator.clipboard.writeText(url);
                        setShowCopiedToast(true);
                        setTimeout(() => setShowCopiedToast(false), 3000);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {user && user.id === solution.creatorId && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/create?edit=${solution.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <UseSolutionForm solution={solution} />

            {/* Toast for URL copied */}
            {showCopiedToast && (
              <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg animate-slide-up">
                <p className="text-sm font-medium">Link copied to clipboard!</p>
              </div>
            )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
