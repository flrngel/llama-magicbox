import { getSolutionBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UseSolutionForm } from "./_components/use-solution-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UseSolutionPage({ params }: { params: { slug: string } }) {
  const solution = getSolutionBySlug(params.slug);

  if (!solution) {
    notFound();
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
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                {solution.name}
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed">
                {solution.problemDescription}
              </p>
              <p className="text-sm text-muted-foreground">Created {solution.creator}</p>
            </div>
            
            <UseSolutionForm solution={solution} />

        </div>
      </main>
      <Footer />
    </div>
  );
}
