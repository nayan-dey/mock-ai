import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { ClassesClient } from "./classes-client";

export default async function ClassesPage() {
  const preloadedClasses = await preloadQuery(api.classes.list, {});

  return <ClassesClient preloadedClasses={preloadedClasses} />;
}
