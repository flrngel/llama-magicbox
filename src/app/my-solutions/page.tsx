"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { type Solution } from "@/lib/data";
import { SolutionCard } from "@/components/solution-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

export default function MySolutionsPage() {
  const { user } = useAuth();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (user) {
      const loadSolutions = async () => {
        try {
          const response = await fetch(`/api/solutions/my?creatorId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setSolutions(data.solutions);
          } else {
            console.error('Failed to load solutions:', response.statusText);
          }
        } catch (error) {
          console.error('Failed to load solutions:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadSolutions();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Create sorted solutions - ALWAYS call this hook
  const sortedSolutions = useMemo(() => {
    const sorted = [...solutions];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "updated":
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "popular":
        sorted.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "status":
        sorted.sort((a, b) => {
          if (a.status === b.status) return 0;
          return a.status === 'draft' ? -1 : 1; // Drafts first
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [solutions, sortBy]);

  const publishedSolutions = sortedSolutions.filter(s => s.status === 'published');
  const draftSolutions = sortedSolutions.filter(s => s.status === 'draft');

  // Handle conditional rendering AFTER all hooks
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                You need to sign in to view your solutions.
              </p>
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your solutions...</p>
              </div>
            </div>
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
        <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Solutions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your AI document processing solutions
          </p>
        </div>
        {solutions.length > 0 && (
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="status">Status (Drafts First)</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {solutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-4">No solutions yet</h2>
          <p className="text-muted-foreground max-w-md">
            You haven't created any solutions yet. Use the "Create Solution" button in the navigation to get started.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({sortedSolutions.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedSolutions.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftSolutions.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedSolutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="published" className="mt-6">
            {publishedSolutions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No published solutions yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedSolutions.map((solution) => (
                  <SolutionCard key={solution.id} solution={solution} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="drafts" className="mt-6">
            {draftSolutions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No draft solutions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftSolutions.map((solution) => (
                  <SolutionCard key={solution.id} solution={solution} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
        </div>
      </main>
      <Footer />
    </div>
  );
}