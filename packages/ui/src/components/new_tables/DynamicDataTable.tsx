'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { TypographyP, TypographySmall } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import Package from '@/public/icons/Package';
import Search from '@/public/icons/Search';
import ChevronsUpDown from '@/public/icons/ChevronsUpDown';
import ChevronUp from '@/public/icons/ChevronUp';
import ChevronDown from '@/public/icons/ChevronDown';
import DiamondPlus from '@/public/icons/DiamondPlus';
import DiamondMinus from '@/public/icons/DiamondMinus';
import Funnel from '@/public/icons/Funnel';
import { CustomDataTable, ExportFormat } from './CustomDataTable';
import { MultiSeverityBadges } from '../badge/SeverityBadge';
import { toast } from 'sonner';
import { getApiFactory } from '@/api/factories/api.factory';
import { useGpt } from '@/hooks/useGpt';
import { cn, getActiveProductRoute } from '@/lib/utils';

// Column action interface for cell click handling
interface ColumnAction {
  action: string;
  prompt: string;
  direct_query?: Record<string, unknown>;
}

interface ColumnMetadata {
  field: string;
  title: string;
  type: string;
  hidden: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  order?: number;
  highlighted?: boolean;
  actions?: ColumnAction[];
  unique_values?: string[] | null;
}

// Column filter state type
export type ColumnFilterState = Record<string, string[]>;

interface DynamicDataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns?: ColumnMetadata[];
  loading?: boolean;
  searchable?: boolean;
  pageable?: boolean;
  pageSize?: number;
  showRefresh?: boolean;
  onRefresh?: () => void;
  showExport?: boolean;
  onExport?: () => void;
  tableHeight?: string;
  emptyMessage?: string;
  customColumnRenderers?: Record<string, (value: unknown, row: T) => React.ReactNode>;
  columnVisibilityControl?: boolean;
  // Expandable row props
  expandable?: boolean;
  expandedRowId?: string | null;
  onExpandedRowChange?: (rowId: string | null) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
  getRowId?: (row: T) => string;
  // Actions column props
  actionsColumn?: boolean;
  renderActions?: (row: T) => React.ReactNode;
  extraControls?: React.ReactNode;
  onRowClick?: (row: T) => void;
  queryId?: string;
}

// Column Filter Dropdown Component
interface ColumnFilterDropdownProps {
  field: string;
  title: string;
  uniqueValues: string[];
  selectedValues: string[];
  onFilterChange: (field: string, values: string[]) => void;
}

function ColumnFilterDropdown({
  field,
  title,
  uniqueValues,
  selectedValues,
  onFilterChange,
}: ColumnFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter unique values based on search query
  const filteredUniqueValues = useMemo(() => {
    if (!searchQuery.trim()) {
      return uniqueValues;
    }
    const query = searchQuery.toLowerCase().trim();
    return uniqueValues.filter((value) => value.toLowerCase().includes(query));
  }, [uniqueValues, searchQuery]);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      newValues = [...selectedValues, value];
    } else {
      newValues = selectedValues.filter((v) => v !== value);
    }
    onFilterChange(field, newValues);
  };

  const handleClearFilter = () => {
    onFilterChange(field, []);
    setSearchQuery('');
  };

  const handleSelectAll = () => {
    // Select all filtered values (visible in current search)
    const currentSelected = new Set(selectedValues);
    filteredUniqueValues.forEach((value) => currentSelected.add(value));
    onFilterChange(field, Array.from(currentSelected));
  };

  const handleDeselectAll = () => {
    // Deselect all filtered values (visible in current search)
    const filteredSet = new Set(filteredUniqueValues);
    const newValues = selectedValues.filter((v) => !filteredSet.has(v));
    onFilterChange(field, newValues);
  };

  // Reset search when popover closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  const isFiltered = selectedValues.length > 0;

  // Check if all filtered values are selected
  const allFilteredSelected =
    filteredUniqueValues.length > 0 &&
    filteredUniqueValues.every((value) => selectedValues.includes(value));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-4 w-4 p-0 relative', isFiltered && 'text-primary-text')}
        >
          <Funnel
            className={cn(
              'h-4 w-4',
              isFiltered ? 'text-primary-text fill-primary/20' : 'text-muted-foreground',
            )}
          />
          {isFiltered && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-medium">
              {selectedValues.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b border-border">
          <TypographySmall className="font-medium">Filter by {title}</TypographySmall>
        </div>
        {/* Search Input */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="p-2 border-b border-border flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
            disabled={filteredUniqueValues.length === 0}
          >
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleClearFilter}
            disabled={!isFiltered}
          >
            Clear
          </Button>
        </div>
        {/* Filter Options */}
        <div className="max-h-48 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredUniqueValues.length > 0 ? (
              filteredUniqueValues.map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.includes(value)}
                    onCheckedChange={(checked) => handleCheckboxChange(value, checked as boolean)}
                  />
                  <span className="text-sm truncate flex-1">{value}</span>
                </label>
              ))
            ) : (
              <div className="px-2 py-3 text-center">
                <TypographySmall className="text-muted-foreground">
                  No results found
                </TypographySmall>
              </div>
            )}
          </div>
        </div>
        {/* Footer showing count */}
        {searchQuery && filteredUniqueValues.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
            <TypographySmall className="text-muted-foreground text-xs">
              Showing {filteredUniqueValues.length} of {uniqueValues.length} items
            </TypographySmall>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function DynamicDataTable<T extends Record<string, unknown>>({
  data,
  columns: columnMetadata,
  loading = false,
  searchable = true,
  pageable = true,
  pageSize = 10,
  showRefresh = false,
  onRefresh,
  showExport = false,
  tableHeight = '600px',
  emptyMessage = 'No results found.',
  customColumnRenderers,
  columnVisibilityControl = true,
  // Expandable props
  expandable = false,
  expandedRowId: controlledExpandedRowId,
  onExpandedRowChange,
  renderExpandedRow,
  getRowId = (row) => String(row.id),
  // Actions props
  actionsColumn = false,
  renderActions,
  extraControls,
  onRowClick,
  queryId,
}: DynamicDataTableProps<T>) {
  // Internal state for uncontrolled expand
  const [internalExpandedRowId, setInternalExpandedRowId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  // Column filter state
  const [columnFilters, setColumnFilters] = useState<ColumnFilterState>({});

  const router = useRouter();
  const { storageService } = getApiFactory();
  const { exportQuery, createConversation } = useGpt();
  const activeProductRoute = getActiveProductRoute();

  // Use controlled or uncontrolled expanded row state
  const expandedRowId =
    controlledExpandedRowId !== undefined ? controlledExpandedRowId : internalExpandedRowId;

  const setExpandedRowId = useCallback(
    (rowId: string | null) => {
      if (onExpandedRowChange) {
        onExpandedRowChange(rowId);
      } else {
        setInternalExpandedRowId(rowId);
      }
    },
    [onExpandedRowChange],
  );

  // Handle column filter change
  const handleColumnFilterChange = useCallback((field: string, values: string[]) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      if (values.length === 0) {
        delete newFilters[field];
      } else {
        newFilters[field] = values;
      }
      return newFilters;
    });
  }, []);

  // Calculate total active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(columnFilters).reduce((acc, values) => acc + values.length, 0);
  }, [columnFilters]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setColumnFilters({});
  }, []);

  // Filter data based on column filters
  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) {
      return data;
    }

    return data.filter((row) => {
      return Object.entries(columnFilters).every(([field, values]) => {
        if (values.length === 0) return true;
        const cellValue = row[field];
        const stringValue = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        return values.includes(stringValue);
      });
    });
  }, [data, columnFilters]);

  // Helper function to replace template variables in prompt
  const replaceTemplateVariables = useCallback(
    (template: string, row: Record<string, unknown>): string => {
      return template.replace(/\{(\w+)\}/g, (match, key) => {
        const value = row[key];
        return value !== undefined && value !== null ? String(value) : match;
      });
    },
    [],
  );

  // Get column metadata by field name
  const getColumnMetadata = useCallback(
    (field: string): ColumnMetadata | undefined => {
      return columnMetadata?.find((col) => col.field === field);
    },
    [columnMetadata],
  );

  // Handle cell click with action
  const handleCellAction = useCallback(
    async (field: string, row: T) => {
      const colMeta = getColumnMetadata(field);
      if (!colMeta?.actions || colMeta.actions.length === 0 || isNavigating) return;

      const action = colMeta.actions[0]; // Use first action
      if (!action.prompt) return;

      const user = storageService.getUser();
      const productId = storageService.getActiveProductId();
      const orgId = storageService.getActiveOrgId();

      if (!user?.id || !productId || !orgId) {
        toast.error('Authentication required', {
          description: 'Please log in to perform this action',
        });
        return;
      }

      setIsNavigating(true);

      try {
        // Replace template variables with actual row values
        const resolvedPrompt = replaceTemplateVariables(
          action.prompt,
          row as Record<string, unknown>,
        );

        // Create a new conversation
        const response = await createConversation({
          title: 'New Search',
          userId: user.id,
          productId: productId,
          orgId: orgId,
        });

        // Store the query in session storage to execute after redirect
        sessionStorage.setItem('pendingQuery', resolvedPrompt);

        // Redirect to the conversation route
        router.push(`${activeProductRoute}/search/${response.conversation_id}`);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        toast.error('Action Failed', {
          description: error instanceof Error ? error.message : 'Failed to navigate',
        });
        setIsNavigating(false);
      }
    },
    [
      getColumnMetadata,
      isNavigating,
      storageService,
      replaceTemplateVariables,
      createConversation,
      router,
      activeProductRoute,
    ],
  );

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!queryId) {
        toast.error('Export Failed', {
          description: 'Query ID is required for export',
        });
        return;
      }

      try {
        const user = storageService.getUser();
        const productId = storageService.getActiveProductId();
        const orgId = storageService.getActiveOrgId();

        if (!user || !productId || !orgId) {
          throw new Error('Authentication required');
        }

        await exportQuery({
          query_id: queryId,
          action: 'export',
          format: format,
          userId: user.id,
          productId,
          orgId,
        });

        toast.success('Export Initiated', {
          description: `Your ${format.toUpperCase()} export has been queued. Download link will be available in notifications.`,
        });
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Export Failed', {
          description: error instanceof Error ? error.message : 'Failed to export data',
        });
      }
    },
    [queryId, exportQuery, storageService],
  );

  const sortedColumnMetadata = useMemo(() => {
    if (!columnMetadata || columnMetadata.length === 0) return [];

    return [...columnMetadata].sort((a, b) => {
      // Handle null/undefined order values - push them to the end
      if (a.order === null || a.order === undefined) return 1;
      if (b.order === null || b.order === undefined) return -1;
      return a.order - b.order;
    });
  }, [columnMetadata]);

  // Check if __select exists in customColumnRenderers
  const hasSelectColumn = useMemo(() => {
    return customColumnRenderers && '__select' in customColumnRenderers;
  }, [customColumnRenderers]);

  // Calculate default column visibility - show only first 6 columns (excluding expand and actions)
  const defaultColumnVisibility = useMemo(() => {
    if (!sortedColumnMetadata || sortedColumnMetadata.length === 0) return {};

    const visibility: Record<string, boolean> = {};

    // Always show expand and actions columns
    if (hasSelectColumn) visibility['__select'] = true;
    if (expandable) visibility['expand'] = true;
    if (actionsColumn) visibility['actions'] = true;

    sortedColumnMetadata.forEach((col) => {
      // Show columns where highlighted is true
      visibility[col.field] = col.highlighted === true;
    });

    return visibility;
  }, [sortedColumnMetadata, expandable, actionsColumn, hasSelectColumn]);

  // Check if a column should show filter (has filterable=true and has unique_values)
  const shouldShowFilter = useCallback((col: ColumnMetadata): boolean => {
    return (
      col.filterable === true &&
      col.unique_values !== null &&
      col.unique_values !== undefined &&
      Array.isArray(col.unique_values) &&
      col.unique_values.length > 0
    );
  }, []);

  // Generate columns dynamically from metadata
  const columns = useMemo<ColumnDef<T>[]>(() => {
    const generatedColumns: ColumnDef<T>[] = [];
    if (hasSelectColumn && customColumnRenderers) {
      generatedColumns.push({
        id: '__select',
        accessorKey: '__select',
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="w-8"></div>,
        cell: ({ row }: { row: { getValue: (key: string) => unknown; original: T } }) => {
          const value = row.getValue('__select');
          return customColumnRenderers['__select'](value, row.original);
        },
      });
    }
    // Add expand column if expandable
    if (expandable) {
      generatedColumns.push({
        id: 'expand',
        accessorKey: 'expand',
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <div className="w-8"></div>,
        cell: ({ row }: { row: { original: T; id: string } }) => {
          const rowId = getRowId(row.original);
          const isExpanded = expandedRowId === rowId;

          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newState = isExpanded ? null : rowId;
                setExpandedRowId(newState);
              }}
            >
              {isExpanded && expandedRowId === rowId ? (
                <DiamondMinus strokeWidth={1.5} className="h-5! w-5! text-primary-text" />
              ) : (
                <DiamondPlus strokeWidth={1.5} className="h-5! w-5! text-muted-foreground" />
              )}
            </Button>
          );
        },
      });
    }

    // Add data columns
    if (!sortedColumnMetadata || sortedColumnMetadata.length === 0) {
      // Fallback: Generate columns from data keys if no metadata
      if (data.length === 0) return generatedColumns;

      const firstRow = data[0];
      const dataColumns = Object.keys(firstRow)
        .filter((key) => key !== '__expand' && key !== '__actions' && key !== '__select')
        .map((key) => ({
          accessorKey: key,
          enableSorting: true,
          enableColumnFilter: true,
          header: ({
            column,
          }: {
            column: {
              toggleSorting: (ascending?: boolean) => void;
              getIsSorted: () => false | 'asc' | 'desc';
            };
          }) => {
            const sortState = column.getIsSorted();
            return (
              <div className="flex items-center gap-1.5">
                <TypographyP className="text-base font-medium">
                  {key
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </TypographyP>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-4 w-4 p-0', sortState && 'text-primary-text')}
                  onClick={() => column.toggleSorting(sortState === 'asc')}
                >
                  {sortState === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : sortState === 'desc' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            );
          },
          cell: ({ row }: { row: { getValue: (key: string) => unknown; original: T } }) => {
            const value = row.getValue(key);
            return renderCell(key, value, 'string', row.original);
          },
        }));

      generatedColumns.push(...dataColumns);
    } else {
      // Generate columns from sorted metadata with proper sorting
      const dataColumns = sortedColumnMetadata.map((col) => ({
        accessorKey: col.field,
        enableSorting: col.sortable !== false,
        enableColumnFilter: col.filterable !== false,
        header: ({
          column,
        }: {
          column: {
            toggleSorting: (ascending?: boolean) => void;
            getIsSorted: () => false | 'asc' | 'desc';
          };
        }) => {
          const sortState = column.getIsSorted();
          return (
            <div className="flex items-center gap-1.5">
              <TypographyP className="text-base font-medium">{col.title}</TypographyP>
              {col.sortable !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-4 w-4 p-0', sortState && 'text-primary-text')}
                  onClick={() => column.toggleSorting(sortState === 'asc')}
                >
                  {sortState === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : sortState === 'desc' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
              {shouldShowFilter(col) && (
                <ColumnFilterDropdown
                  field={col.field}
                  title={col.title}
                  uniqueValues={col.unique_values as string[]}
                  selectedValues={columnFilters[col.field] || []}
                  onFilterChange={handleColumnFilterChange}
                />
              )}
            </div>
          );
        },
        cell: ({ row }: { row: { getValue: (field: string) => unknown; original: T } }) => {
          const value = row.getValue(col.field);
          const hasActions = col.actions && col.actions.length > 0;

          // Get the cell content
          let cellContent: React.ReactNode;

          // Use custom renderer if provided
          if (customColumnRenderers && customColumnRenderers[col.field]) {
            cellContent = customColumnRenderers[col.field](value, row.original);
          } else {
            // Default renderers based on field type or name
            cellContent = renderCell(col.field, value, col.type, row.original);
          }

          // Wrap with clickable container if column has actions
          if (hasActions) {
            return (
              <div
                className={cn(
                  'cursor-pointer hover:text-primary-text transition-colors',
                  'underline decoration-dotted decoration-muted-foreground/35 underline-offset-4',
                  'hover:decoration-muted-foreground',
                  isNavigating && 'opacity-50 pointer-events-none',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCellAction(col.field, row.original);
                }}
                title={
                  col.actions?.[0]?.prompt
                    ? replaceTemplateVariables(
                        col.actions[0].prompt,
                        row.original as Record<string, unknown>,
                      )
                    : undefined
                }
              >
                {cellContent}
              </div>
            );
          }

          return cellContent;
        },
      }));

      generatedColumns.push(...dataColumns);
    }

    // Add actions column if enabled
    if (actionsColumn && renderActions) {
      generatedColumns.push({
        id: 'actions',
        accessorKey: 'actions',
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <TypographyP className="text-base font-medium">Actions</TypographyP>,
        cell: ({ row }: { row: { original: T } }) => renderActions(row.original),
      });
    }

    return generatedColumns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortedColumnMetadata,
    data,
    customColumnRenderers,
    expandable,
    actionsColumn,
    expandedRowId,
    setExpandedRowId,
    getRowId,
    renderActions,
    handleCellAction,
    replaceTemplateVariables,
    isNavigating,
    columnFilters,
    handleColumnFilterChange,
    shouldShowFilter,
  ]);

  // Default cell renderer with smart formatting
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderCell = (field: string, value: unknown, type: string, row: T): React.ReactNode => {
    // Handle CHML (Critical, High, Medium, Low) type - for vulnerability/findings counts
    if (type.toLowerCase() === 'chml') {
      if (value === null || value === undefined || typeof value !== 'object') {
        return <TypographyP className="text-muted-foreground">-</TypographyP>;
      }

      const chmlData = value as Record<string, number>;

      // Transform to VulnerabilitySummary format
      // Note: exploitable is set to 0 since the data doesn't include it
      const vulnerabilities = {
        exploitable: 0,
        critical: chmlData.critical || 0,
        high: chmlData.high || 0,
        medium: chmlData.medium || 0,
        low: chmlData.low || 0,
      };

      return (
        <MultiSeverityBadges
          vulnerabilities={vulnerabilities}
          hideZeroCounts={false}
          showLabels={true}
          size="xs"
          orientation="horizontal"
        />
      );
    }

    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      return <TypographyP className="text-muted-foreground">-</TypographyP>;
    }

    // Handle nested objects - extract displayable value
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      // Try to find a displayable property in order of preference
      const displayValue =
        obj.name || obj.title || obj.label || obj.value || obj.text || obj.display;

      if (displayValue !== undefined && displayValue !== null) {
        return <TypographyP className="text-base">{String(displayValue)}</TypographyP>;
      }

      // If no standard property found, show a formatted string
      return (
        <TypographyP className="text-muted-foreground text-xs font-mono">
          {JSON.stringify(value).substring(0, 50)}...
        </TypographyP>
      );
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <TypographyP className="text-muted-foreground">-</TypographyP>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Badge>
          ))}
          {value.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 3} more
            </Badge>
          )}
        </div>
      );
    }

    // Component/Package name (if field contains 'name' or 'component')
    if (field.toLowerCase().includes('name') || field.toLowerCase().includes('component')) {
      return (
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <TypographyP className="text-base truncate">{String(value)}</TypographyP>
        </div>
      );
    }

    // Version fields
    if (field.toLowerCase().includes('version')) {
      return (
        <Badge variant="secondary" className="font-medium">
          {String(value)}
        </Badge>
      );
    }

    // Status/Level fields (with color coding)
    if (
      field.toLowerCase().includes('status') ||
      field.toLowerCase().includes('level') ||
      field.toLowerCase().includes('severity')
    ) {
      const statusValue = String(value).toLowerCase();
      const colorMap: Record<string, string> = {
        // SLSA Levels
        'slsa l1': 'bg-primary/10 border-primary/25 text-primary-text',
        'slsa l2': 'bg-green-500/10 border-green-500/25 text-green-500',
        'slsa l3': 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500',
        'slsa l4': 'bg-purple-500/10 border-purple-500/25 text-purple-500',
        // Verification Status
        verified: 'bg-green-500/10 border-green-500/25 text-green-500',
        pending: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500',
        failed: 'bg-red-500/10 border-red-500/25 text-red-500',
        // General status
        active: 'bg-green-500/10 border-green-500/25 text-green-500',
        inactive: 'bg-gray-500/10 border-gray-500/25 text-gray-500',
        // Severity
        critical: 'bg-red-500/10 border-red-500/25 text-red-500',
        high: 'bg-orange-500/10 border-orange-500/25 text-orange-500',
        medium: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500',
        low: 'bg-primary/10 border-primary/25 text-primary-text',
      };

      const colorClass = colorMap[statusValue] || 'bg-muted border-border text-foreground';

      return (
        <Badge variant="outline" className={`font-medium border ${colorClass}`}>
          {String(value)}
        </Badge>
      );
    }

    // Date fields
    if (
      field.toLowerCase().includes('date') ||
      field.toLowerCase().includes('time') ||
      field.toLowerCase().includes('at')
    ) {
      try {
        const date = new Date(String(value));
        if (!isNaN(date.getTime())) {
          return (
            <TypographySmall className="text-muted-foreground">
              {date.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </TypographySmall>
          );
        }
      } catch {
        // Fall through to default
      }
    }

    // URL/Link fields
    if (field.toLowerCase().includes('url') || field.toLowerCase().includes('link')) {
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-text hover:underline truncate block max-w-xs"
        >
          {String(value)}
        </a>
      );
    }

    // PURL fields
    if (field.toLowerCase().includes('purl')) {
      return (
        <TypographySmall className="text-muted-foreground font-mono truncate block max-w-md">
          {String(value)}
        </TypographySmall>
      );
    }

    // Boolean fields
    if (type.toLowerCase() === 'boolean' || typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
    }

    // Number fields
    if (type.toLowerCase() === 'number' || typeof value === 'number') {
      return <TypographyP className="text-base font-medium">{String(value)}</TypographyP>;
    }

    // Default: Plain text
    return <TypographyP className="text-base">{String(value)}</TypographyP>;
  };

  const tableKey = useMemo(() => {
    if (!columnMetadata || columnMetadata.length === 0) return 'loading';
    return columnMetadata.map((col) => col.field).join('-');
  }, [columnMetadata]);

  // Create adapter function for renderExpandedRow to work with React Table Row
  const adaptedRenderExpandedRow = useMemo(() => {
    if (!renderExpandedRow) return undefined;

    return (row: { original: T }) => {
      return renderExpandedRow(row.original);
    };
  }, [renderExpandedRow]);

  // Create getRowId adapter for React Table
  const reactTableGetRowId = useMemo(() => {
    return (originalRow: T) => getRowId(originalRow);
  }, [getRowId]);

  const adaptedOnRowClick = useMemo(() => {
    if (!onRowClick) return undefined;

    return (row: { original: T }) => {
      return onRowClick(row.original);
    };
  }, [onRowClick]);

  // Create filter controls for header
  const filterControls = useMemo(() => {
    if (activeFilterCount === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Funnel className="h-3 w-3" />
          {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
        </Badge>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClearAllFilters}>
          Clear all
        </Button>
      </div>
    );
  }, [activeFilterCount, handleClearAllFilters]);

  // Combine extra controls with filter controls
  const combinedExtraControls = useMemo(() => {
    return (
      <>
        {filterControls}
        {extraControls}
      </>
    );
  }, [filterControls, extraControls]);

  return (
    <div className="w-full space-y-0">
      <CustomDataTable
        key={tableKey}
        columns={columns}
        data={filteredData}
        columnVisibilityControl={columnVisibilityControl}
        defaultColumnVisibility={defaultColumnVisibility}
        loading={loading}
        searchable={searchable}
        pageable={pageable}
        pageSize={pageSize}
        showRefresh={showRefresh}
        onRefresh={onRefresh}
        showExport={showExport}
        onExport={handleExport}
        tableHeight={tableHeight}
        emptyMessage={emptyMessage}
        stickyHeader={true}
        showPaginationInfo={false}
        // Pass expandable props to CustomDataTable
        expandable={expandable}
        renderExpandedRow={adaptedRenderExpandedRow}
        expandedRowId={expandedRowId}
        onExpandedRowChange={onExpandedRowChange}
        getRowId={reactTableGetRowId}
        extraControls={combinedExtraControls}
        onRowClick={adaptedOnRowClick}
      />
    </div>
  );
}
