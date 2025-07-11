import { useState, useCallback } from 'react';
import { BannerType } from '@/components/NotificationBanner';

export interface Notification {
  id: string;
  type: BannerType;
  title: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  showCloseButton?: boolean;
  autoHide?: boolean;
}

export interface NotificationOptions {
  type: BannerType;
  title: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  showCloseButton?: boolean;
  autoHide?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((options: NotificationOptions) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      ...options,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration if specified
    if (options.autoHide !== false && options.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, options.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper methods for common notification types
  const showSuccess = useCallback((title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'error',
      title,
      message,
      ...options,
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
} 