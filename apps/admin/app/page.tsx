"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent } from "@repo/ui";
import {
  ShieldCheck,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/dashboard");
    }
  }, [isLoaded, user, router]);

  // While loading or if authenticated, show nothing (will redirect)
  if (!isLoaded || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Nindo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Admin Portal
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Manage your institute,{" "}
            <span className="text-primary">effortlessly</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Create tests, manage students, track performance, and grow your
            coaching institute — all from one place.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/sign-in">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
          <Card className="border-none bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Tests & Questions</h3>
              <p className="text-sm text-muted-foreground">
                Create, publish, and manage mock tests with ease
              </p>
            </CardContent>
          </Card>
          <Card className="border-none bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Student Management</h3>
              <p className="text-sm text-muted-foreground">
                Organize batches, track attendance, and manage fees
              </p>
            </CardContent>
          </Card>
          <Card className="border-none bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track performance with detailed dashboards and reports
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Nindo Admin Portal
      </footer>
    </div>
  );
}
