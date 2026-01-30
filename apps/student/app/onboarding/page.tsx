"use client";

import { useUser, useClerk } from "@clerk/nextjs";
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
  Input,
  useToast,
} from "@repo/ui";
import { KeyRound, ArrowRight, LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function OnboardingSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check URL param first, then fallback to sessionStorage (survives OAuth redirects)
  const urlRef = searchParams.get("ref") || "";
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const joinByReferralCode = useMutation(api.batches.joinByReferralCode);

  // Auto-populate from URL ref param or sessionStorage fallback
  useEffect(() => {
    const refCode = urlRef || sessionStorage.getItem("batch_ref_code") || "";
    if (refCode) {
      setCode(refCode.toUpperCase());
    }
  }, [urlRef]);

  // If user already has a batch, redirect to dashboard
  if (dbUser?.batchId) {
    router.push("/dashboard");
    return null;
  }

  if (!isUserLoaded || (user && dbUser === undefined)) {
    return <OnboardingSkeleton />;
  }

  if (!dbUser) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <Card className="w-full max-w-sm py-8 text-center">
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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !dbUser) return;

    setError("");
    setIsSubmitting(true);
    try {
      const result = await joinByReferralCode({
        userId: dbUser._id,
        referralCode: code.trim(),
      });
      // Clean up stored ref code
      sessionStorage.removeItem("batch_ref_code");
      toast({
        title: "Welcome!",
        description: `You've joined ${result.batchName}. Let's get started!`,
      });
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err?.message || "Failed to join batch. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-6 sm:py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Welcome, {user?.firstName || dbUser.name}!
          </CardTitle>
          <CardDescription>
            Enter your batch code to get started. Ask your instructor for the
            code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="Enter batch code (e.g. WBPOL25)"
                className="text-center font-mono text-lg tracking-widest"
                maxLength={10}
                autoFocus
              />
              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!code.trim() || isSubmitting}
              className="w-full gap-2"
            >
              {isSubmitting ? (
                "Joining..."
              ) : (
                <>
                  Join Batch <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full gap-2 text-muted-foreground"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
