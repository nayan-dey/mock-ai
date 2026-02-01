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
import { KeyRound, ArrowRight, LogOut, Building2, ChevronLeft } from "lucide-react";
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

  // URL params
  const urlRef = searchParams.get("ref") || "";
  const urlOrg = searchParams.get("org") || "";

  const [step, setStep] = useState<"institution" | "batch-code">("institution");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Fetch all institutions for dropdown
  const organizations = useQuery(api.organizations.listPublic);

  // If org slug is in URL, look it up
  const orgFromSlug = useQuery(
    api.organizations.getBySlug,
    urlOrg ? { slug: urlOrg } : "skip"
  );

  const joinByReferralCode = useMutation(api.batches.joinByReferralCode);

  // Auto-populate from URL params or sessionStorage
  useEffect(() => {
    const refCode = urlRef || sessionStorage.getItem("batch_ref_code") || "";
    if (refCode) {
      setCode(refCode.toUpperCase());
    }

    const orgSlug = urlOrg || sessionStorage.getItem("org_slug") || "";
    if (orgSlug && orgFromSlug) {
      setSelectedOrgId(orgFromSlug._id);
      setSelectedOrgName(orgFromSlug.name);
      setStep("batch-code");
    }
  }, [urlRef, urlOrg, orgFromSlug]);

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

  const handleSelectInstitution = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    setStep("batch-code");
    setError("");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !dbUser || !selectedOrgId) return;

    setError("");
    setIsSubmitting(true);
    try {
      const result = await joinByReferralCode({
        referralCode: code.trim(),
        organizationId: selectedOrgId as any,
      });
      // Clean up stored values
      sessionStorage.removeItem("batch_ref_code");
      sessionStorage.removeItem("org_slug");
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

  // Step 1: Institution selection
  if (step === "institution") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-6 sm:py-8">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Welcome, {user?.firstName || dbUser.name}!
            </CardTitle>
            <CardDescription>
              Select your institution to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizations === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : organizations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No institutions available yet. Please contact your instructor.
              </p>
            ) : (
              organizations.map((org) => (
                <Button
                  key={org._id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => handleSelectInstitution(org._id, org.name)}
                >
                  <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="text-left">{org.name}</span>
                </Button>
              ))
            )}
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

  // Step 2: Batch code entry
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-6 sm:py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Join {selectedOrgName}
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
            onClick={() => {
              setStep("institution");
              setSelectedOrgId(null);
              setSelectedOrgName("");
              setError("");
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Choose a different institution
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
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
