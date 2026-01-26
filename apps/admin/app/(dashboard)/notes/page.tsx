import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/database";
import { NotesClient } from "./notes-client";

export default async function NotesPage() {
  const preloadedNotes = await preloadQuery(api.notes.list, {});

  return <NotesClient preloadedNotes={preloadedNotes} />;
}
