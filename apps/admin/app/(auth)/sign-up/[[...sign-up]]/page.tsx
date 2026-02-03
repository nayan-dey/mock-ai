"use client";

import { SignUp } from "@clerk/nextjs";
import { DraftingCompass } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <DraftingCompass className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">Nindo Admin Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your administrator account to get started.
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}
