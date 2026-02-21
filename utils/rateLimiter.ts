// Rate Limiter for AI API calls to prevent hitting limits too quickly

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitIfNeeded(key: string = 'default'): Promise<void> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < this.config.windowMs);
    
    // Check if we've exceeded the limit
    if (recentRequests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = this.config.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        // Rate limit reached - wait before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Clean up again after waiting
        const updatedRequests = (this.requests.get(key) || []).filter(
          timestamp => Date.now() - timestamp < this.config.windowMs
        );
        this.requests.set(key, updatedRequests);
      }
    }
    
    // Record this request
    const currentRequests = this.requests.get(key) || [];
    currentRequests.push(now);
    this.requests.set(key, currentRequests);
  }

  canMakeRequest(key: string = 'default'): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(timestamp => now - timestamp < this.config.windowMs);
    return recentRequests.length < this.config.maxRequests;
  }

  reset(key: string = 'default'): void {
    this.requests.delete(key);
  }
}

// Note: OpenAI rate limiter removed as OpenAI support was removed

