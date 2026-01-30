"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  ScrollArea,
  Separator,
} from "@repo/ui";
import { Loader2 } from "lucide-react";

interface AdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  wide?: boolean;
}

export function AdminSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
  submitDisabled = false,
  wide = false,
}: AdminSheetProps) {
  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`flex flex-col gap-0 p-0 ${wide ? "w-full sm:max-w-2xl" : "w-full sm:max-w-lg"}`}
      >
        {/* Header */}
        <div className="px-6 py-4">
          <SheetHeader className="space-y-1">
            <SheetTitle>{title}</SheetTitle>
            {description && (
              <SheetDescription>{description}</SheetDescription>
            )}
          </SheetHeader>
        </div>

        <Separator />

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">{children}</div>
        </ScrollArea>

        {/* Sticky footer */}
        {onSubmit && (
          <>
            <Separator />
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitDisabled || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
