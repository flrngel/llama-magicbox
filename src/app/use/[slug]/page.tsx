import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSolutionBySlug } from "@/lib/db-operations";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UseSolutionForm } from "./_components/use-solution-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RatingStats } from "@/components/rating-stats";
import { ShareButton } from "./_components/share-button";
import { EditButton } from "./_components/edit-button";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const solution = await getSolutionBySlug(slug);
    
    if (!solution) {
      return {
        title: "Knowledge Model Not Found - MagicBox",
      };
    }

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://magicbox.ai'}/api/og?title=${encodeURIComponent(solution.name)}&description=${encodeURIComponent(solution.description || '')}&creator=${encodeURIComponent(solution.creator || '')}`;

    return {
      title: `${solution.name} - MagicBox`,
      description: solution.description || `Access ${solution.creator}'s expertise through AI`,
      openGraph: {
        title: solution.name,
        description: solution.description || `Access ${solution.creator}'s expertise through AI`,
        type: "website",
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://magicbox.ai'}/use/${slug}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: solution.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: solution.name,
        description: solution.description || `Access ${solution.creator}'s expertise through AI`,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "MagicBox - No-Code AI Modeling",
    };
  }
}

export default async function UseSolutionPage({ params }: Props) {
  const { slug } = await params;
  
  let solution;
  try {
    solution = await getSolutionBySlug(slug);
  } catch (error) {
    console.error("Error loading solution:", error);
    notFound();
  }

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
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                  {solution.name}
                </h1>
                <p className="text-muted-foreground md:text-xl/relaxed mt-4">
                  {solution.problemDescription}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Knowledge shared {solution.creator}
                </p>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <RatingStats 
                  solutionId={solution.id} 
                  usageCount={solution.usageCount} 
                />
                <div className="flex gap-2">
                  <ShareButton slug={solution.slug} />
                  <EditButton 
                    solutionId={solution.id} 
                    creatorId={solution.creatorId} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <UseSolutionForm solution={solution} />
        </div>
      </main>
      <Footer />
    </div>
  );
}