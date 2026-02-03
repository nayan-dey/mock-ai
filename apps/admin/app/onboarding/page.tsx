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
  Label,
  Textarea,
  ImageUpload,
} from "@repo/ui";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Users,
  Plus,
  Clock,
  LogOut,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type OnboardingStep = "choose" | "create-org" | "join-org" | "pending";

function OnboardingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOnboardingPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organization = useQuery(
    api.organizations.getByAdminClerkId,
    user?.id ? { adminClerkId: user.id } : "skip"
  );

  const pendingRequest = useQuery(
    api.orgJoinRequests.getMyPendingRequest,
    user?.id ? {} : "skip"
  );

  const publicOrgs = useQuery(api.organizations.listPublic);

  const createOrganization = useMutation(api.organizations.create);
  const createJoinRequest = useMutation(api.orgJoinRequests.create);
  const generateLogoUploadUrl = useMutation(api.organizations.generateLogoUploadUrl);

  const [step, setStep] = useState<OnboardingStep>("choose");
  const [searchQuery, setSearchQuery] = useState("");
  const [logoStorageId, setLogoStorageId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    phone: "",
    address: "",
  });

  // If pending request exists, switch to pending state
  useEffect(() => {
    if (pendingRequest && step !== "pending") {
      setStep("pending");
    }
  }, [pendingRequest, step]);

  // If org already exists, redirect to dashboard
  if (organization) {
    router.push("/dashboard");
    return null;
  }

  if (!isLoaded || (user && organization === undefined)) {
    return <OnboardingSkeleton />;
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user ||
      !formData.name.trim() ||
      !formData.address.trim() ||
      !formData.phone.trim() ||
      !formData.description.trim()
    )
      return;

    setIsSubmitting(true);
    try {
      await createOrganization({
        name: formData.name.trim(),
        description: formData.description.trim(),
        logoStorageId: logoStorageId || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      } as any);
      toast.success("Organization created! Welcome to Nindo.");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinOrg = async (orgId: string) => {
    setIsSubmitting(true);
    try {
      await createJoinRequest({
        organizationId: orgId as any,
      });
      toast.success("Join request submitted! Waiting for approval.");
      setStep("pending");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit join request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  const filteredOrgs = publicOrgs?.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Step: Choose path
  if (step === "choose") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Nindo</h1>
            <p className="mt-2 text-muted-foreground">
              Get started by creating a new organization or joining an existing
              one
            </p>
          </div>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setStep("create-org")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Create New Organization</h3>
                <p className="text-sm text-muted-foreground">
                  Set up a new coaching institute from scratch
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setStep("join-org")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Join Existing Organization</h3>
                <p className="text-sm text-muted-foreground">
                  Request to join as an admin of an existing institute
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Create org form
  if (step === "create-org") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Set Up Your Organization
            </CardTitle>
            <CardDescription>
              Tell us about your coaching institute to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Nindo Academy"
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="A short description of your organization"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Your organization address"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Helpline / Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="space-y-2">
                <ImageUpload
                  onUpload={(id) => setLogoStorageId(id)}
                  onRemove={() => setLogoStorageId(null)}
                  generateUploadUrl={generateLogoUploadUrl}
                  maxSizeMB={10}
                  shape="square"
                  size="lg"
                  label="Organization Logo (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  placeholder="contact@yourorg.com"
                  autoComplete="email"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setStep("choose")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={
                    !formData.name.trim() ||
                    !formData.description.trim() ||
                    !formData.address.trim() ||
                    !formData.phone.trim() ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    "Creating\u2026"
                  ) : (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: Join existing org
  if (step === "join-org") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Join an Organization</CardTitle>
            <CardDescription>
              Select an organization to request admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organizations..."
                className="pl-10"
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {!publicOrgs ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </>
              ) : filteredOrgs && filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <Card
                    key={org._id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => !isSubmitting && handleJoinOrg(org._id)}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{org.name}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Building2 className="mx-auto mb-2 h-8 w-8" />
                  <p>No organizations found</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setStep("choose")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: Pending approval
  if (step === "pending" || pendingRequest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Pending Approval</CardTitle>
            <CardDescription>
              Your request to join{" "}
              <span className="font-semibold text-foreground">
                {pendingRequest?.organizationName ?? "the organization"}
              </span>{" "}
              is waiting for approval from an existing administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              You will be automatically redirected once your request is approved.
            </div>
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
