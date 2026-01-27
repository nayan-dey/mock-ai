"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Button,
} from "@repo/ui";
import { Ban, LogOut, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SuspendedSkeleton() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
      <Skeleton className="h-64 w-full max-w-md rounded-xl" />
    </div>
  );
}

export default function SuspendedPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Redirect away if user is not suspended
  useEffect(() => {
    if (dbUser && !dbUser.isSuspended) {
      router.replace("/");
    }
  }, [dbUser, router]);

  if (!isUserLoaded || (user && dbUser === undefined)) {
    return <SuspendedSkeleton />;
  }

  // If user is not suspended, show loading while redirecting
  if (!dbUser?.isSuspended) {
    return <SuspendedSkeleton />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
            <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Account Suspended</CardTitle>
          <CardDescription>
            Your account has been suspended by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dbUser.suspendReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Reason for suspension:
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {dbUser.suspendReason}
              </p>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            <Mail className="mx-auto mb-2 h-5 w-5" />
            <p>
              If you believe this is a mistake, please contact the administrator
              for assistance.
            </p>
          </div>

          <SignOutButton>
            <Button variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  );
}
