'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TypographyP, TypographySmall } from '@/components/ui/typography';
import Search from '@/public/icons/Search';
import RefreshCcw from '@/public/icons/RefreshCcw';
import Download from '@/public/icons/Download';
import ChevronsUpDown from '@/public/icons/ChevronsUpDown';
import Funnel from '@/public/icons/Funnel';
import ChevronDown from '@/public/icons/ChevronDown';
import { cn } from '@/lib/utils';
import Share from '@/public/icons/Share';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Table2 } from 'lucide-react';

export type ExportFormat =
  | 'csv'
  | 'tsv'
  | 'json'
  | 'ndjson'
  | 'excel'
  | 'parquet'
  | 'pdf'
  | 'xml'
  | 'html'
  | 'markdown'
  | 'sql';

export const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'tsv', label: 'TSV' },
  { value: 'json', label: 'JSON' },
  { value: 'ndjson', label: 'NDJSON' },
  { value: 'excel', label: 'Excel' },
  { value: 'parquet', label: 'Parquet' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xml', label: 'XML' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
];

export interface CustomDataTableProps<TData, TValue> {
  // Required props
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Search functionality
  searchable?: boolean;
  searchPlaceholder?: string;
  searchClassName?: string;

  // Pagination
  pageable?: boolean;
  pageSize?: number;
  showPaginationInfo?: boolean;

  // Actions in header
  showRefresh?: boolean;
  onRefresh?: () => void;
  showExport?: boolean;
  onExport?: (format: ExportFormat) => void;
  showShare?: boolean;
  onShare?: () => void;
  customActions?: React.ReactNode;

  // Table styling
  tableHeight?: string;
  stickyHeader?: boolean;
  className?: string;
  headerClassName?: string;
  tableContainerClassName?: string;
  tableClassName?: string;
  tableHeaderClassName?: string;
  tableBodyClassName?: string;
  tableRowClassName?: string;
  tableHeaderRowClassName?: string;
  tableCellClassName?: string;
  tableHeaderCellClassName?: string;
  paginationClassName?: string;
  paginationInfoClassName?: string;

  // Row interactions
  onRowClick?: (row: Row<TData>) => void;
  rowClassName?: string | ((row: Row<TData>) => string);

  // Expandable rows - Simple implementation like PoliciesPage
  expandable?: boolean;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  expandedRowId?: string | null; // Single expanded row at a time (like PoliciesPage)
  onExpandedRowChange?: (expandedRowId: string | null) => void;
  expandedRowClassName?: string;
  getRowId?: (originalRow: TData) => string;

  // Column configuration
  columnVisibilityControl?: boolean;
  defaultColumnVisibility?: VisibilityState;

  // Empty state
  emptyMessage?: string;
  emptyStateClassName?: string;

  // Loading state
  loading?: boolean;
  loadingClassName?: string;
  extraControls?: React.ReactNode;
}

export interface ColumnHeaderProps {
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  onSort?: () => void;
}

export function ColumnHeader({
  title,
  sortable = true,
  filterable = false,
  onSort,
}: ColumnHeaderProps) {
  return (
    <div className="flex items-center gap-1.5">
      <TypographyP className="text-base font-medium">{title}</TypographyP>
      {sortable && (
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={onSort}>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
      {filterable && (
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
          <Funnel className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

export function CustomDataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchClassName,
  pageable = true,
  pageSize = 10,
  showPaginationInfo = true,
  showRefresh = false,
  onRefresh,
  showExport = false,
  onExport,
  showShare = false,
  onShare,
  customActions,
  tableHeight = '500px',
  stickyHeader = true,
  className,
  headerClassName,
  tableContainerClassName,
  tableClassName,
  tableHeaderClassName,
  tableBodyClassName,
  tableRowClassName,
  tableHeaderRowClassName,
  tableCellClassName,
  tableHeaderCellClassName,
  paginationClassName,
  paginationInfoClassName,
  onRowClick,
  rowClassName,
  expandable = false,
  renderExpandedRow,
  expandedRowId = null,
  expandedRowClassName,
  getRowId,
  columnVisibilityControl = false,
  defaultColumnVisibility,
  emptyMessage = 'No results.',
  emptyStateClassName,
  loading = false,
  loadingClassName,
  extraControls,
}: CustomDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    defaultColumnVisibility || {},
  );
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table');

  const [globalFilter, setGlobalFilter] = React.useState('');
  const [internalExpandedRowId, setInternalExpandedRowId] = React.useState<string | null>(
    expandedRowId,
  );
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Sync external expandedRowId with internal state
  React.useEffect(() => {
    setInternalExpandedRowId(expandedRowId);
  }, [expandedRowId]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pageable ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: getRowId, // Use custom getRowId if provided
    initialState: {
      pagination: pageable
        ? {
            pageSize: pageSize,
          }
        : undefined,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination?.pageIndex + 1 || 1;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (pageCount <= maxVisiblePages) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(pageCount);
      } else if (currentPage >= pageCount - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = pageCount - 3; i <= pageCount; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(pageCount);
      }
    }

    return pages;
  };

  const handleRowClick = (row: Row<TData>, e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="checkbox"]') ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }

    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleExportFormat = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className={cn('rounded-lg bg-card', className)}>
      {/* Header with Search and Actions */}
      {(searchable ||
        showRefresh ||
        showExport ||
        showShare ||
        customActions ||
        columnVisibilityControl) && (
        <div className={cn('flex-none border-b border-border bg-card p-3', headerClassName)}>
          <div className="flex items-center justify-between gap-3">
            {searchable && (
              <div className={cn('relative flex-1', searchClassName)}>
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="h-11 max-w-[300px] rounded-lg border-border bg-card pl-10 shadow-sm"
                />
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {extraControls}

              {columnVisibilityControl && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 gap-1.5 rounded-lg border-border bg-card px-3 shadow-sm"
                    >
                      <TypographySmall className="font-medium">Columns</TypographySmall>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] max-h-52">
                    {(() => {
                      const hideableColumns = table
                        .getAllColumns()
                        .filter((column) => column.getCanHide());

                      if (hideableColumns.length === 0) {
                        return (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No columns available
                          </div>
                        );
                      }

                      return hideableColumns.map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          onSelect={(e) => e.preventDefault()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {column.id.replace('_', ' ')}
                        </DropdownMenuCheckboxItem>
                      ));
                    })()}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {showShare && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-auto px-3 rounded-lg border-border bg-card shadow-sm hover:bg-muted hover:text-muted-foreground"
                  onClick={onShare}
                >
                  <Share className="h-5 w-5" />
                  Share
                </Button>
              )}
              {showRefresh && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-lg border-border bg-card shadow-sm hover:bg-muted hover:text-muted-foreground"
                  onClick={onRefresh}
                >
                  <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              {showExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 gap-1.5 rounded-lg border-border bg-card px-3 shadow-sm"
                    >
                      <Download className="h-5 w-5" />
                      Export
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px] max-h-52">
                    {EXPORT_FORMATS.map((format) => (
                      <DropdownMenuItem
                        key={format.value}
                        onClick={() => handleExportFormat(format.value)}
                        className="cursor-pointer"
                      >
                        {format.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {/* VIEW MODE TOGGLE */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'card')}>
                <TabsList className="h-11">
                  <TabsTrigger value="table" className="h-full">
                    <Table2 className="h-5 w-5 mx-1" />
                  </TabsTrigger>
                  <TabsTrigger value="card" className="h-full">
                    <LayoutGrid className="h-5 w-5 mx-1" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {customActions}
            </div>
          </div>
        </div>
      )}

      {/* Table/Card View Container */}
      {viewMode === 'table' ? (
        // TABLE VIEW
        <div
          className={cn('hide-scrollbar relative', tableContainerClassName)}
          ref={tableContainerRef}
          style={{
            overflow: 'auto',
            position: 'relative',
            height: tableHeight === 'auto' ? 'auto' : tableHeight,
          }}
        >
          <Table className={tableClassName}>
            <TableHeader
              className={tableHeaderClassName}
              style={
                stickyHeader
                  ? {
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }
                  : undefined
              }
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className={cn('border-b border-border hover:bg-sidebar', tableHeaderRowClassName)}
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          'h-12 px-3 text-base font-medium text-foreground bg-sidebar',
                          tableHeaderCellClassName,
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className={tableBodyClassName}>
              {loading ? (
                <TableRow className={tableRowClassName}>
                  <TableCell
                    colSpan={columns.length}
                    className={cn('h-24 text-center', loadingClassName)}
                  >
                    <TypographyP>Loading...</TypographyP>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isExpanded = internalExpandedRowId === row.id;

                  return (
                    <React.Fragment key={row.id}>
                      {/* Main Row */}
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        className={cn(
                          'border-b border-border hover:bg-muted',
                          onRowClick && 'cursor-pointer',
                          tableRowClassName,
                          typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
                        )}
                        onClick={(e) => handleRowClick(row, e)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cn('px-3 py-3', tableCellClassName)}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Expanded Row Content */}
                      {expandable && renderExpandedRow && isExpanded && (
                        <TableRow
                          className={cn('border-b border-border bg-muted/30', expandedRowClassName)}
                        >
                          <TableCell colSpan={columns.length} className="p-0">
                            {renderExpandedRow(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow className={tableRowClassName}>
                  <TableCell
                    colSpan={columns.length}
                    className={cn('h-24 text-center', emptyStateClassName)}
                  >
                    <TypographyP>{emptyMessage ? emptyMessage : 'No results.'}</TypographyP>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination for Table View */}
          {pageable && table.getRowModel().rows?.length > 0 && (
            <div
              className={cn(
                'flex items-center sticky bg-background bottom-0 left-0 w-full shrink-0 justify-between border-t border-border px-4 py-3',
                paginationClassName,
              )}
              style={{ minWidth: 'fit-content' }}
            >
              {showPaginationInfo && (
                <TypographySmall
                  className={cn('text-sm shrink-0 text-muted-foreground', paginationInfoClassName)}
                >
                  Showing{' '}
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{' '}
                  to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    data.length,
                  )}{' '}
                  of {data.length} results
                </TypographySmall>
              )}
              <Pagination className={!showPaginationInfo ? 'mx-auto' : ''}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => table.previousPage()}
                      className={
                        !table.getCanPreviousPage()
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, index) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => table.setPageIndex((page as number) - 1)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => table.nextPage()}
                      className={
                        !table.getCanNextPage()
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        // CARD VIEW
        <div className="flex flex-col" style={{ height: tableHeight }}>
          {/* Scrollable Cards Container */}
          <div className={cn('hide-scrollbar flex-1 p-4 overflow-auto', tableContainerClassName)}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <TypographyP>Loading...</TypographyP>
              </div>
            ) : table.getRowModel().rows?.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <TypographyP className="text-muted-foreground">{emptyMessage}</TypographyP>
              </div>
            ) : (
              <div className="space-y-3">
                {table.getRowModel().rows.map((row) => {
                  const isExpanded = internalExpandedRowId === row.id;
                  // Find select and actions cells for this row
                  const selectCell = row
                    .getVisibleCells()
                    .find((cell) => cell.column.id === 'select' || cell.column.id === '__select');
                  const actionsCell = row
                    .getVisibleCells()
                    .find((cell) => cell.column.id === 'actions');

                  return (
                    <div
                      key={row.id}
                      className={cn(
                        'rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md relative',
                        onRowClick && 'cursor-pointer hover:border-primary/50',
                        isExpanded && 'ring-2 ring-primary/20',
                        row.getIsSelected() && 'ring-2 ring-primary/50 bg-primary/5',
                      )}
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {/* Top Row: Selection Checkbox (left) and Actions Menu (right) */}
                      {(selectCell || actionsCell) && (
                        <div
                          className={cn('flex items-center justify-between', selectCell && 'mb-3')}
                        >
                          {/* Selection Checkbox - Top Left */}
                          {selectCell ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              {flexRender(
                                selectCell.column.columnDef.cell,
                                selectCell.getContext(),
                              )}
                            </div>
                          ) : (
                            <div /> // Empty div to maintain spacing
                          )}

                          {/* Actions Menu - Top Right (render directly, it already has its own dropdown) */}
                          {actionsCell && (
                            <div
                              className={cn(
                                'flex items-center gap-2',
                                !selectCell && 'absolute top-2 right-2',
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {flexRender(
                                actionsCell.column.columnDef.cell,
                                actionsCell.getContext(),
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Content - Single Line Items with constrained click area */}
                      <div className="space-y-2">
                        {row.getVisibleCells().map((cell) => {
                          // Skip expand, actions, and select columns
                          if (
                            cell.column.id === 'expand' ||
                            cell.column.id === 'actions' ||
                            cell.column.id === 'select' ||
                            cell.column.id === '__select'
                          )
                            return null;

                          return (
                            <div key={cell.id} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground shrink-0">
                                {cell.column.id
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                                :
                              </span>
                              {/* FIX: Changed from flex-1 to shrink-0 and added max-width to prevent full-width click area */}
                              <div className="text-sm shrink-0">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expanded Content */}
                      {expandable && isExpanded && renderExpandedRow && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {renderExpandedRow(row)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination for Card View - Outside scrollable area */}
          {pageable && !loading && table.getRowModel().rows?.length > 0 && (
            <div
              className={cn(
                'flex items-center shrink-0 bg-background justify-between border-t border-border px-4 py-3',
                paginationClassName,
              )}
            >
              {showPaginationInfo && (
                <TypographySmall
                  className={cn('text-sm shrink-0 text-muted-foreground', paginationInfoClassName)}
                >
                  Showing{' '}
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{' '}
                  to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    data.length,
                  )}{' '}
                  of {data.length} results
                </TypographySmall>
              )}
              <Pagination className={!showPaginationInfo ? 'mx-auto' : ''}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => table.previousPage()}
                      className={
                        !table.getCanPreviousPage()
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, index) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => table.setPageIndex((page as number) - 1)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => table.nextPage()}
                      className={
                        !table.getCanNextPage()
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
