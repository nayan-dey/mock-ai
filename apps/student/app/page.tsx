import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { ArrowRight, BookOpen, FileText, Video, Trophy } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b px-4 py-10 text-center sm:px-6 sm:py-14 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-2xl font-bold tracking-tight sm:mb-6 sm:text-4xl md:text-5xl">
            Ace Your Exams with
            <span className="text-primary"> MockTest</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-sm text-muted-foreground sm:mb-8 sm:text-base">
            Practice with thousands of questions, track your progress, and improve
            your scores with our comprehensive mock test platform.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-xl font-bold sm:mb-12 sm:text-2xl">
            Everything You Need to Succeed
          </h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Mock Tests</CardTitle>
                <CardDescription>
                  Take timed tests with real exam-like questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Practice with carefully curated questions that match the actual
                  exam pattern and difficulty level.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Detailed Results</CardTitle>
                <CardDescription>
                  Get comprehensive analysis of your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track your scores, identify weak areas, and monitor your
                  improvement over time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Study Notes</CardTitle>
                <CardDescription>
                  Access curated study materials and notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Download and study from comprehensive notes prepared by expert
                  educators.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Recorded Classes</CardTitle>
                <CardDescription>
                  Watch video lectures at your own pace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn from recorded sessions covering all topics with detailed
                  explanations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Ready to Start Your Journey?</h2>
          <p className="mb-6 text-sm text-muted-foreground sm:mb-8 sm:text-base">
            Join thousands of students who are already preparing smarter with
            MockTest.
          </p>
          <Link href="/sign-up">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-xs text-muted-foreground sm:text-sm">
          <p>2024 MockTest. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
