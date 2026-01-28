import { clerkProxy } from "@clerk/nextjs/server";

export async function GET() {
  return clerkProxy();
}

export async function POST() {
  return clerkProxy();
}
