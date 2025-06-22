"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  slug: string;
}

export function ShareButton({ slug }: ShareButtonProps) {
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/use/${slug}`;
    navigator.clipboard.writeText(url);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 3000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      
      {/* Toast for URL copied */}
      {showCopiedToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg animate-slide-up z-50">
          <p className="text-sm font-medium">Link copied to clipboard!</p>
        </div>
      )}
    </>
  );
}