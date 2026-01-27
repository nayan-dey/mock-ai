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
  Avatar,
  AvatarFallback,
  Button,
  Input,
  Label,
  Textarea,
  sonnerToast as toast,
} from "@repo/ui";
import { ArrowLeft, Save, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BatchSwitchDialog } from "../../../components/batch-switch-dialog";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function EditProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="mb-6 flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const batch = useQuery(
    api.batches.getById,
    dbUser?.batchId ? { id: dbUser.batchId } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  // Disable batch switching if user's batch is locked (set by admin during unsuspension)
  const isBatchLocked = dbUser?.batchLocked === true;

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    age: "",
  });

  useEffect(() => {
    if (dbUser) {
      setFormData({
        name: dbUser.name || "",
        bio: dbUser.bio || "",
        age: dbUser.age?.toString() || "",
      });
    }
  }, [dbUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;

    setIsSaving(true);
    try {
      await updateProfile({
        userId: dbUser._id,
        name: formData.name || undefined,
        bio: formData.bio || undefined,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
      });
      toast.success("Profile updated successfully");
      router.push("/me");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isUserLoaded || (user && dbUser === undefined)) {
    return <EditProfileSkeleton />;
  }

  if (!dbUser) {
    return <EditProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Back button */}
      <Link
        href="/me"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>

      {/* Avatar */}
      <div className="mb-6 flex flex-col items-center">
        <Avatar className="h-24 w-24 border-2 border-border">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={dbUser.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
              {getInitials(dbUser.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <p className="mt-2 text-xs text-muted-foreground">
          Profile photo managed by Clerk
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name"
            />
          </CardContent>
        </Card>

        {/* Age */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, age: e.target.value }))
              }
              placeholder="Your age"
            />
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bio</CardTitle>
            <CardDescription className="text-xs">
              Tell others a bit about yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Write a short bio..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Current Batch */}
        <Card className={isBatchLocked ? "opacity-75" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Batch</CardTitle>
            <CardDescription className="text-xs">
              Your assigned batch for tests and classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {batch?.name || "No batch assigned"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBatchDialog(true)}
                disabled={isBatchLocked}
                className={isBatchLocked ? "grayscale" : ""}
              >
                {isBatchLocked ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Locked
                  </>
                ) : (
                  "Switch Batch"
                )}
              </Button>
            </div>
            {isBatchLocked ? (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                <span>
                  Your batch has been assigned by an administrator and cannot be
                  changed. Contact support if you need assistance.
                </span>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Batch switching is logged. Multiple switches may result in
                  account suspension for anti-theft protection.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </form>

      {/* Batch Switch Dialog */}
      <BatchSwitchDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        currentBatchId={dbUser.batchId}
        userId={dbUser._id}
      />
    </div>
  );
}
