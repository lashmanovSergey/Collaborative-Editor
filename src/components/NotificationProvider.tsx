import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type NotificationType = 'info' | 'success' | 'error';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => undefined,
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-stack" aria-live="assertive">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification notification-toast notification--${notification.type}`}>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
