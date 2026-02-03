export function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];

  // If 4 or fewer pages, show all
  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  // Determine which pages to show around current
  if (currentPage <= 2) {
    // Near the start: show 1, 2, ..., last
    pages.push(2);
    pages.push("ellipsis");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 1) {
    // Near the end: show 1, ..., (last-1), last
    pages.push("ellipsis");
    pages.push(totalPages - 1);
    pages.push(totalPages);
  } else {
    // In the middle: show 1, ..., current, ..., last
    pages.push("ellipsis");
    pages.push(currentPage);
    pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
}
