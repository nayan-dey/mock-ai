"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  // Persist ref code to sessionStorage so it survives the OAuth redirect chain
  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("batch_ref_code", ref);
    }
  }, [ref]);

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
