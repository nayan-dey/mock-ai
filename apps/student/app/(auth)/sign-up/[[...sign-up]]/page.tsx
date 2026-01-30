"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const org = searchParams.get("org");

  // Persist ref code and org slug to sessionStorage so they survive the OAuth redirect chain
  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("batch_ref_code", ref);
    }
    if (org) {
      sessionStorage.setItem("org_slug", org);
    }
  }, [ref, org]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
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
