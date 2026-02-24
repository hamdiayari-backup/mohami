import { Notification as NotificationType } from '../types';
import { pool } from './db';
import { storageService } from './storageService';

type NotificationCallback = (notification: NotificationType) => void;

class NotificationService {
  private pollingInterval: number | null = null;
  private callbacks: NotificationCallback[] = [];
  private lastCheckTime: string = new Date().toISOString();
  private isPolling: boolean = false;

  // Start polling for new notifications
  startPolling(intervalMs: number = 3000) {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollingInterval = window.setInterval(async () => {
      await this.checkForNewNotifications();
    }, intervalMs);
    
    // Initial check
    this.checkForNewNotifications();
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
    }
  }

  // Check for new notifications
  private async checkForNewNotifications() {
    const user = storageService.getCurrentUser();
    if (!user) return;

    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         AND created_at > $2 
         AND read = FALSE
         ORDER BY created_at DESC`,
        [user.id, this.lastCheckTime]
      );

      if (result.rows.length > 0) {
        const notifications = result.rows.map(this.mapNotification);
        
        // Notify all callbacks
        notifications.forEach(notification => {
          this.callbacks.forEach(callback => callback(notification));
        });

        // Update last check time
        this.lastCheckTime = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  // Subscribe to new notifications
  subscribe(callback: NotificationCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Get all notifications for current user
  async getNotifications(includeRead: boolean = false, limit: number = 50): Promise<NotificationType[]> {
    const user = storageService.getCurrentUser();
    if (!user) return [];

    try {
      let query = `SELECT * FROM notifications WHERE user_id = $1`;
      const params: any[] = [user.id];

      if (!includeRead) {
        query += ` AND read = FALSE`;
      }

      query += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(Math.min(Math.max(limit, 1), 500));

      const result = await pool.query(query, params);
      return result.rows.map(this.mapNotification);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const user = storageService.getCurrentUser();
    if (!user) return 0;

    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
        [user.id]
      );
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE notifications SET read = TRUE WHERE id = $1',
        [notificationId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    const user = storageService.getCurrentUser();
    if (!user) return;

    try {
      await pool.query(
        'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
        [user.id]
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Create a notification
  async createNotification(
    userId: string,
    type: NotificationType['type'],
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, any>
  ): Promise<NotificationType> {
    const notification: NotificationType = {
      id: Date.now().toString(),
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      link,
      metadata
    };

    try {
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, read, created_at, link, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          notification.id,
          notification.userId,
          notification.type,
          notification.title,
          notification.message,
          notification.read,
          notification.createdAt,
          notification.link || null,
          JSON.stringify(metadata || {})
        ]
      );

      // If notification is for current user, trigger callback immediately
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.callbacks.forEach(callback => callback(notification));
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Helper to map database row to Notification
  private mapNotification(row: any): NotificationType {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType['type'],
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
      link: row.link,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {}
    };
  }

  // Check for upcoming appointments (called periodically)
  async checkUpcomingAppointments() {
    const user = storageService.getCurrentUser();
    if (!user) return;

    try {
      const events = await storageService.getEvents();
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      for (const event of events) {
        const eventDate = new Date(event.date);
        
        // Check if event is within next hour and we haven't notified yet
        if (eventDate > now && eventDate <= oneHourFromNow) {
          // Check if notification already exists
          const existing = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             AND type = 'appointment' 
             AND metadata->>'eventId' = $2
             AND created_at > $3`,
            [user.id, event.id, new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()]
          );

          if (existing.rows.length === 0) {
            await this.createNotification(
              user.id,
              'appointment',
              'موعد قريب',
              `لديك موعد "${event.title}" خلال ساعة`,
              `/calendar`,
              { eventId: event.id, eventDate: event.date }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming appointments:', error);
    }
  }
}

export const notificationService = new NotificationService();

