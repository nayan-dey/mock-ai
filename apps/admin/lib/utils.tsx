import { Badge } from "@repo/ui";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return (
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
          Published
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-500">
          Draft
        </Badge>
      );
    case "archived":
      return (
        <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">
          Archived
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
