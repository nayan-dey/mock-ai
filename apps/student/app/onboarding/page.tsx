"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Button,
  useToast,
} from "@repo/ui";
import { GraduationCap, Users, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function OnboardingSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const batches = useQuery(api.batches.list, { activeOnly: true });
  const updateBatch = useMutation(api.batches.assignUserToBatch);

  // If user already has a batch, redirect to dashboard
  if (dbUser?.batchId) {
    router.push("/dashboard");
    return null;
  }

  if (!isUserLoaded || (user && (dbUser === undefined || batches === undefined))) {
    return <OnboardingSkeleton />;
  }

  if (!dbUser) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md py-8 text-center">
          <CardContent>
            <h3 className="mb-2 text-base font-medium sm:text-lg">
              Setting Up Your Account
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Please wait while we set up your account...
            </p>
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectBatch = async () => {
    if (!selectedBatch || !dbUser) return;

    setIsSubmitting(true);
    try {
      await updateBatch({
        userId: dbUser._id,
        batchId: selectedBatch as any,
      });
      toast({
        title: "Welcome!",
        description: "You've been added to your batch. Let's get started!",
      });
      router.push("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "Failed to join batch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-6 sm:py-8">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome, {user?.firstName || dbUser.name}!</CardTitle>
          <CardDescription>
            Select your batch to get started with personalized content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {batches && batches.length > 0 ? (
            <>
              <div className="space-y-2">
                {batches.map((batch) => (
                  <button
                    key={batch._id}
                    onClick={() => setSelectedBatch(batch._id)}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      selectedBatch === batch._id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{batch.name}</p>
                      {batch.description && (
                        <p className="text-sm text-muted-foreground">
                          {batch.description}
                        </p>
                      )}
                    </div>
                    {selectedBatch === batch._id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleSelectBatch}
                  disabled={!selectedBatch || isSubmitting}
                  className="flex-1 gap-2"
                >
                  {isSubmitting ? (
                    "Joining..."
                  ) : (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                No batches are currently available. You can continue without
                selecting a batch.
              </p>
              <Button onClick={handleSkip} className="gap-2">
                Continue to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
