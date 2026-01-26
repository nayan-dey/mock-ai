"use client";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button";

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function SortableHeader<TData, TValue>({
  column,
  title,
  className,
}: SortableHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
