import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="hsl(25, 75%, 50%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12.99 6.74 1.93 3.44" />
          <path d="M19.136 12a10 10 0 0 1-14.271 0" />
          <path d="m21 21-2.16-3.84" />
          <path d="m3 21 8.02-14.26" />
          <circle cx="12" cy="5" r="2" />
        </svg>
        <span className="font-serif text-2xl font-semibold tracking-tight">
          Nindo
        </span>
      </div>

      <h1 className="font-serif text-7xl font-bold tracking-tight text-primary sm:text-8xl">
        404
      </h1>

      <h2 className="mt-4 font-serif text-xl font-medium text-foreground sm:text-2xl">
        Page not found
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Back to Dashboard
      </Link>
    </div>
  );
}
