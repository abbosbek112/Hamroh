/**
 * =========================================================================================
 * ⏱️ REQUEST TIMEOUT UTILITY
 * =========================================================================================
 * Wrapper for fetch with timeout support
 * =========================================================================================
 */

/**
 * Fetch with timeout
 */
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = 30000 // 30 seconds default
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - qayta urinib ko\'ring');
    }
    throw error;
  }
};

/**
 * Promise with timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeout: number = 30000,
  errorMessage: string = 'Operation timeout'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeout)
    ),
  ]);
};
