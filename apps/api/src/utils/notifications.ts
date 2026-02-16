import { EventEmitter } from 'events';

/**
 * Event types for notifications
 */
export type NotificationEventType =
  | 'post.created'
  | 'post.statusChanged'
  | 'post.commented'
  | 'vote.created'
  | 'changelog.published';

export interface NotificationEvent {
  type: NotificationEventType;
  companyID: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Simple event emitter for notifications
 * This is a stub that can be extended to support:
 * - Email notifications
 * - Webhooks
 * - Slack/Discord integrations
 * - Push notifications
 */
class NotificationEmitter extends EventEmitter {
  emit(event: NotificationEventType, data: Omit<NotificationEvent, 'type' | 'timestamp'>): boolean {
    const payload: NotificationEvent = {
      type: event,
      timestamp: new Date(),
      ...data,
    };
    
    // Log notification in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📣 Notification:', payload);
    }
    
    return super.emit(event, payload);
  }
}

export const notifications = new NotificationEmitter();

// Default listeners (stubs for future implementation)
notifications.on('post.statusChanged', (event: NotificationEvent) => {
  // TODO: Send email to post author and voters
  // TODO: Trigger webhooks
});

notifications.on('post.commented', (event: NotificationEvent) => {
  // TODO: Send email to post author
});

notifications.on('changelog.published', (event: NotificationEvent) => {
  // TODO: Send changelog email to subscribers
});
