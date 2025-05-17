"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  useEffect(() => {
    if (isLoading) {
      document.body.style.backgroundColor = "#EBCECE";
    } else {
      document.body.style.backgroundColor = "";
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-[#EBCECE]",
      "backdrop-blur-sm"
    )}>
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E57F84]" />
    </div>
  );
}
