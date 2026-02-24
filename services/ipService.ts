/**
 * Service to fetch and validate client IP for session security.
 * Prevents account sharing by binding sessions to IP.
 */

export const ipService = {
  async getClientIP(): Promise<string | null> {
    try {
      // Try multiple IP services for reliability
      const urls = [
        'https://api.ipify.org?format=json',
        'https://api64.ipify.org?format=json',
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          const data = await res.json();
          if (data?.ip) return data.ip;
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  async validateSessionIP(userId: string): Promise<{ valid: boolean; currentIP?: string | null }> {
    const storedIP = localStorage.getItem(`allowed_ip_${userId}`);
    if (!storedIP) return { valid: true }; // No IP bound yet - allow (first login)

    const currentIP = await this.getClientIP();
    if (!currentIP) return { valid: true }; // Can't verify - allow to avoid blocking

    return { valid: storedIP === currentIP, currentIP };
  },

  async bindIPToUser(userId: string): Promise<void> {
    const ip = await this.getClientIP();
    if (ip) {
      localStorage.setItem(`allowed_ip_${userId}`, ip);
    }
  },

  setAllowedIP(userId: string, ip: string): void {
    localStorage.setItem(`allowed_ip_${userId}`, ip);
  },

  clearIPBinding(userId: string): void {
    localStorage.removeItem(`allowed_ip_${userId}`);
  },
};
