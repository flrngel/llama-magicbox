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
  const [sortBy, setSortBy] = useState("newest");

  const filteredSolutions = useMemo(() => {
    let filtered = solutions.filter((solution) => {
      const matchesSearch =
        solution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solution.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || solution.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [solutions, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container px-4 md:px-6 py-8">
          {/* Page Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Solution Marketplace
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 md:text-xl/relaxed max-w-2xl mx-auto">
              Discover and use AI solutions built by experts in the community.
            </p>
          </div>
          
          {/* Search, Filter, and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-10 max-w-4xl mx-auto">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <Input
                placeholder="Search solutions..."
                className="pl-12 h-12 text-base"
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
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Solutions Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-purple-600 opacity-20 mx-auto"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading amazing solutions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-animation">
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