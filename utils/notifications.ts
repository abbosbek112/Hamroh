import { logger } from './logger';

export const notificationService = {
    // Check if notifications are supported
    isSupported: () => 'Notification' in window,

    // Request permission
    requestPermission: async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            logger.warn('Notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            logger.error('Error requesting notification permission:', error);
            return false;
        }
    },

    // Get current permission state
    getPermission: (): NotificationPermission => {
        if (!('Notification' in window)) return 'denied';
        return Notification.permission;
    },

    // Send a simple notification
    send: (title: string, options?: NotificationOptions) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            logger.warn('Cannot send notification: Permission not granted or not supported');
            return;
        }

        try {
            // Use Service Worker registration if available for mobile support
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    // Service Worker NotificationOptions supports vibrate
                    const swOptions: NotificationOptions & { vibrate?: number[] } = {
                        icon: '/icon.svg',
                        badge: '/icon.svg',
                        vibrate: [200, 100, 200],
                        ...options
                    };
                    registration.showNotification(title, swOptions);
                });
            } else {
                // Fallback to classic API (doesn't support vibrate)
                new Notification(title, {
                    icon: '/icon.svg',
                    ...options
                });
            }
        } catch (error) {
            logger.error('Error sending notification:', error);
        }
    },

    // Schedule a notification (Basic setTimeout implementation for open tabs)
    // For real background scheduling, we need Push API with backend, but this works for open apps
    schedule: (title: string, options: NotificationOptions, delayMs: number) => {
        setTimeout(() => {
            notificationService.send(title, options);
        }, delayMs);
    }
};
