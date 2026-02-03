"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { DataTableViewOptions } from "./data-table-view-options";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "./data-table-faceted-filter";

export interface FacetedFilterConfig {
  columnId: string;
  title: string;
  options: FacetedFilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig[];
  showColumnVisibility?: boolean;
  toolbarExtra?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  facetedFilters,
  showColumnVisibility = false,
  toolbarExtra,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const hasContent =
    searchKey || (facetedFilters && facetedFilters.length > 0) || showColumnVisibility || toolbarExtra;

  if (!hasContent) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b p-3">
      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[200px] min-w-[150px] lg:w-[300px]"
          />
        )}
        {facetedFilters?.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;
          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}
        {toolbarExtra}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 shrink-0 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {showColumnVisibility && (
        <div className="shrink-0">
          <DataTableViewOptions table={table} />
        </div>
      )}
    </div>
  );
}
