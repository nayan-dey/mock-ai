"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export interface FilterStateConfig {
  [key: string]: string | string[];
}

export interface FilterStateReturn {
  filters: FilterStateConfig;
  setFilter: (key: string, value: string | string[]) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
}

/**
 * Hook to sync multiple filter values with URL search params.
 * Supports both string and array values (for faceted filters).
 */
export function useFilterState(
  defaultValues: FilterStateConfig = {}
): FilterStateReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filter values from URL
  const filters = Object.keys(defaultValues).reduce((acc, key) => {
    const urlValue = searchParams.get(key);
    const defaultValue = defaultValues[key];

    if (urlValue) {
      // Check if it's a comma-separated array value
      if (Array.isArray(defaultValue)) {
        acc[key] = urlValue.split(',').filter(Boolean);
      } else {
        acc[key] = urlValue;
      }
    } else {
      acc[key] = defaultValue;
    }

    return acc;
  }, {} as FilterStateConfig);

  // Set a single filter value
  const setFilter = useCallback(
    (key: string, value: string | string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      const defaultValue = defaultValues[key];

      // Determine if we should remove or set the param
      const isDefault = Array.isArray(value)
        ? value.length === 0 ||
          (Array.isArray(defaultValue) &&
           value.length === defaultValue.length &&
           value.every((v, i) => v === defaultValue[i]))
        : value === defaultValue || value === "";

      if (isDefault) {
        params.delete(key);
      } else {
        // For arrays, join with comma
        const paramValue = Array.isArray(value) ? value.join(',') : value;
        params.set(key, paramValue);
      }

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname, defaultValues]
  );

  // Clear a single filter
  const clearFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove all filter keys
    Object.keys(defaultValues).forEach((key) => {
      params.delete(key);
    });

    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname, defaultValues]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
  };
}
