import { pool } from './db';

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
}

export interface VisitorChartPoint {
  date: string;
  visits: number;
  label: string;
}

export interface RegistrationChartPoint {
  month: string;
  count: number;
  label: string;
}

export const visitorService = {
  // Record a visit
  recordVisit: async (sessionId: string, page: string = 'landing'): Promise<void> => {
    try {
      const visitDate = new Date().toISOString();
      const dateOnly = visitDate.split('T')[0]; // YYYY-MM-DD
      
      // Check if this session already visited today
      const existingVisit = await pool.query(
        `SELECT id FROM platform_visitors 
         WHERE session_id = $1 AND visit_date LIKE $2 
         LIMIT 1`,
        [sessionId, `${dateOnly}%`]
      );

      const isUnique = existingVisit.rows.length === 0;
      
      // Get IP and user agent (if available in browser)
      const ipAddress = null; // Will be null in browser, can be set server-side
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

      await pool.query(
        `INSERT INTO platform_visitors (id, session_id, ip_address, user_agent, page_visited, visit_date, is_unique, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          ipAddress,
          userAgent,
          page,
          visitDate,
          isUnique,
          visitDate
        ]
      );
    } catch (error) {
      console.error('Error recording visit:', error);
      // Don't throw - visitor tracking shouldn't break the app
    }
  },

  // Get visitor statistics
  getVisitorStats: async (): Promise<VisitorStats> => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Start of week (Monday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      const weekStart = startOfWeek.toISOString().split('T')[0];
      
      // Start of month
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      // Total visits
      const totalResult = await pool.query('SELECT COUNT(*) as count FROM platform_visitors');
      const totalVisits = parseInt(totalResult.rows[0]?.count || '0');

      // Unique visitors (distinct session_ids)
      const uniqueResult = await pool.query('SELECT COUNT(DISTINCT session_id) as count FROM platform_visitors');
      const uniqueVisitors = parseInt(uniqueResult.rows[0]?.count || '0');

      // Visits today
      const todayResult = await pool.query(
        `SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1`,
        [`${today} 00:00:00`]
      );
      const visitsToday = parseInt(todayResult.rows[0]?.count || '0');

      // Visits this week
      const weekResult = await pool.query(
        `SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1`,
        [`${weekStart} 00:00:00`]
      );
      const visitsThisWeek = parseInt(weekResult.rows[0]?.count || '0');

      // Visits this month
      const monthResult = await pool.query(
        `SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1`,
        [`${monthStart} 00:00:00`]
      );
      const visitsThisMonth = parseInt(monthResult.rows[0]?.count || '0');

      return {
        totalVisits,
        uniqueVisitors,
        visitsToday,
        visitsThisWeek,
        visitsThisMonth
      };
    } catch (error) {
      console.error('Error getting visitor stats:', error);
      return {
        totalVisits: 0,
        uniqueVisitors: 0,
        visitsToday: 0,
        visitsThisWeek: 0,
        visitsThisMonth: 0
      };
    }
  },

  getVisitsChartData: async (days: number = 14): Promise<VisitorChartPoint[]> => {
    try {
      const result = await pool.query(
        `SELECT SUBSTRING(visit_date, 1, 10) as d, COUNT(*) as c 
         FROM platform_visitors 
         WHERE visit_date >= $1 
         GROUP BY SUBSTRING(visit_date, 1, 10) 
         ORDER BY d`,
        [new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
      );
      const map: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split('T')[0];
        map[key] = 0;
      }
      (result.rows || []).forEach((r: any) => { map[r.d] = parseInt(r.c || '0'); });
      return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([date, visits]) => ({
        date,
        visits,
        label: new Date(date + 'T12:00:00').toLocaleDateString('ar-TN', { day: 'numeric', month: 'short' })
      }));
    } catch {
      return [];
    }
  },

  getRegistrationsChartData: async (months: number = 6): Promise<RegistrationChartPoint[]> => {
    try {
      const { rows } = await pool.query(
        `SELECT id, created_at FROM users WHERE role != 'ADMIN'`
      );
      const monthCounts: Record<string, number> = {};
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[key] = 0;
      }
      (rows || []).forEach((r: any) => {
        let date: Date;
        if (r.created_at) {
          date = new Date(r.created_at);
        } else {
          const ts = parseInt(r.id) || (r.id?.startsWith('tm_') ? parseInt(r.id.split('_')[1]) : NaN);
          date = isNaN(ts) ? new Date() : new Date(ts);
        }
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthCounts[key] !== undefined) monthCounts[key]++;
      });
      return Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({
        month,
        count,
        label: new Date(month + '-01').toLocaleDateString('ar-TN', { month: 'short', year: 'numeric' })
      }));
    } catch {
      return [];
    }
  },

  // Get visitor stats by date range
  getVisitorStatsByDateRange: async (startDate: string, endDate: string): Promise<number> => {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM platform_visitors 
         WHERE visit_date >= $1 AND visit_date <= $2`,
        [startDate, endDate]
      );
      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      console.error('Error getting visitor stats by date range:', error);
      return 0;
    }
  }
};
