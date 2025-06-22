import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Knowledge Model Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The knowledge model you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/">Back to Marketplace</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}