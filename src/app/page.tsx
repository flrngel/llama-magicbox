import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SolutionCard } from "@/components/solution-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getSolutions } from "@/lib/data";

export default function Home() {
  const featuredSolutions = getSolutions().slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Turn Your Expertise Into AI Solutions
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Train AI with your documents. Share solutions instantly. No code required.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/create">Create Solution</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/browse">Browse Solutions</Link>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground pt-4">
                  <p><strong>127</strong> solutions created, <strong>2,349</strong> documents processed</p>
                </div>
              </div>
              <div className="hidden xl:flex items-center justify-center">
                 <img
                  src="https://placehold.co/600x400.png"
                  alt="Demo GIF"
                  data-ai-hint="data analysis"
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Featured Solutions</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Get started instantly with our pre-built solutions for common document processing tasks.
                </p>
              </div>
            </div>
            <div className="mx-auto grid grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featuredSolutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
              ))}
            </div>
            <div className="flex justify-center">
              <Button asChild variant="link" size="lg">
                <Link href="/browse">View All Solutions →</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
