import { redirect } from "next/navigation";

export default function SignUpPage() {
  // Admin sign-up is disabled - redirect to sign-in
  redirect("/sign-in");
}
