"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  DataTable,
  type ColumnDef,
  type FacetedFilterConfig,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@repo/ui";
import { MoreVertical, Plus } from "lucide-react";

// ─── Action Column Helper ─────────────────────────────────────────────────────

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
  disabled?: boolean;
}

export function createActionsColumn<TData>(
  getActions: (row: TData) => ActionMenuItem[]
): ColumnDef<TData, unknown> {
  return {
    id: "_actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const actions = getActions(row.original);
      if (actions.length === 0) return null;
      return (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {actions.map((action, i) => (
                <React.Fragment key={action.label}>
                  {action.separator && i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!action.disabled) action.onClick();
                    }}
                    disabled={action.disabled}
                    className={
                      action.variant === "destructive"
                        ? "text-destructive focus:text-destructive"
                        : ""
                    }
                  >
                    {action.icon && (
                      <span className="mr-2 flex h-4 w-4 items-center justify-center">
                        {action.icon}
                      </span>
                    )}
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };
}

// ─── AdminTable Component ─────────────────────────────────────────────────────

interface AdminTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  pageSize?: number;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  toolbarExtra?: React.ReactNode;
  headerExtra?: React.ReactNode;
  facetedFilters?: FacetedFilterConfig[];
  showColumnVisibility?: boolean;
  rowClassName?: (row: TData) => string;
  renderSubRow?: (row: TData) => React.ReactNode | null;
}

export function AdminTable<TData>({
  columns: rawColumns,
  data,
  searchKey,
  searchPlaceholder,
  onRowClick,
  isLoading,
  emptyIcon,
  emptyTitle = "No data found",
  emptyDescription,
  emptyAction,
  pageSize = 10,
  title,
  description,
  primaryAction,
  toolbarExtra,
  headerExtra,
  facetedFilters,
  showColumnVisibility = true,
  rowClassName,
  renderSubRow,
}: AdminTableProps<TData>) {
  // Wrap non-action column cells with click handler when onRowClick is provided
  const columns = React.useMemo(() => {
    if (!onRowClick) return rawColumns;
    return rawColumns.map((col) => {
      if ((col as any).id === "_actions") return col;
      const originalCell = col.cell;
      return {
        ...col,
        cell: (props: any) => (
          <div onClick={() => onRowClick(props.row.original)}>
            {typeof originalCell === "function"
              ? originalCell(props)
              : props.getValue()}
          </div>
        ),
      };
    });
  }, [rawColumns, onRowClick]);
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0 && !searchKey) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {primaryAction && (
            <Button onClick={primaryAction.onClick} size="sm" className="gap-2">
              {primaryAction.icon || <Plus className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            {emptyIcon && (
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {emptyIcon}
              </div>
            )}
            <h3 className="font-medium">{emptyTitle}</h3>
            {emptyDescription && (
              <p className="mt-1 text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            )}
            {emptyAction && (
              <Button
                onClick={emptyAction.onClick}
                size="sm"
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                {emptyAction.label}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {primaryAction && (
          <Button onClick={primaryAction.onClick} size="sm" className="gap-2">
            {primaryAction.icon || <Plus className="h-4 w-4" />}
            {primaryAction.label}
          </Button>
        )}
      </div>

      {/* Optional header extra (compact stats, etc.) */}
      {headerExtra}

      {/* Table with integrated toolbar */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
          <DataTable
            columns={columns}
            data={data}
            searchKey={searchKey}
            searchPlaceholder={searchPlaceholder}
            showPagination
            pageSize={pageSize}
            emptyMessage={emptyTitle}
            className="h-full"
            rowClassName={(row: TData) => {
              const click = onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : "";
              const custom = rowClassName?.(row) ?? "";
              return [click, custom].filter(Boolean).join(" ");
            }}
            facetedFilters={facetedFilters}
            showColumnVisibility={showColumnVisibility}
            toolbarExtra={toolbarExtra}
            renderSubRow={renderSubRow}
          />
        </CardContent>
      </Card>
    </div>
  );
}
