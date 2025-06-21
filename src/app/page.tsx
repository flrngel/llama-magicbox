"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SolutionCard } from "@/components/solution-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { fetchSolutions, getCategories } from "@/lib/data-client";
import { Solution } from "@/lib/data";
import { Search } from "lucide-react";

export default function Home() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [categories] = useState<string[]>(getCategories());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSolutions() {
      try {
        const data = await fetchSolutions();
        setSolutions(data);
      } catch (error) {
        console.error('Failed to load solutions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSolutions();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredSolutions = useMemo(() => {
    return solutions.filter((solution) => {
      const matchesSearch =
        solution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solution.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || solution.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [solutions, searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container px-4 md:px-6 py-8">
          {/* Page Header */}
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
              Solution Marketplace
            </h1>
            <p className="text-muted-foreground md:text-xl/relaxed">
              Discover and use AI solutions built by experts in the community.
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search solutions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Solutions Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading solutions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSolutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
              ))}
            </div>
          )}
          
          {!loading && filteredSolutions.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>No solutions found. Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}