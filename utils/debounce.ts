/**
 * =========================================================================================
 * ⏱️ DEBOUNCE UTILITY
 * =========================================================================================
 * Simple debounce function for search inputs and other delayed operations
 * =========================================================================================
 */

/**
 * Debounce function - delays execution until after delay milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Hook for React components (requires React import in component)
 * Usage:
 *   const debouncedValue = useDebounce(value, 300);
 */
// Note: This hook should be used in components, not here
// Move to a separate hooks file if needed
