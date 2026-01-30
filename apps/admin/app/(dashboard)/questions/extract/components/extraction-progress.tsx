"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Card } from "@repo/ui";

interface ExtractionProgressProps {
  fileName: string;
}

export function ExtractionProgress({ fileName }: ExtractionProgressProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <div className="relative">
          <div className="rounded-full bg-primary/10 p-6">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1">
            <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Extracting Questions</h3>
          <p className="text-muted-foreground">
            AI is analyzing your document and extracting questions...
          </p>
          <p className="text-sm text-muted-foreground">
            File: {fileName}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-pulse bg-primary" style={{ width: "60%" }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This may take a moment depending on the document size
          </p>
        </div>
      </div>
    </Card>
  );
}
