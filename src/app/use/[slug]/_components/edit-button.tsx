"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Link from "next/link";

interface EditButtonProps {
  solutionId: string;
  creatorId: string;
}

export function EditButton({ solutionId, creatorId }: EditButtonProps) {
  const { user } = useAuth();

  if (!user || user.id !== creatorId) {
    return null;
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/create?edit=${solutionId}`}>
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </Link>
    </Button>
  );
}