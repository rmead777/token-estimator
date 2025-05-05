
import { X } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  message: string;
  type: "error" | "warning" | "info";
  timestamp: Date;
}

interface NotificationBarProps {
  notifications: Notification[];
}

export function NotificationBar({ notifications: initialNotifications }: NotificationBarProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-gray-800 bg-gray-900">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`flex items-center justify-between p-2 text-sm ${
            notification.type === "error" 
              ? "bg-red-900/30 text-red-300" 
              : notification.type === "warning"
              ? "bg-yellow-900/30 text-yellow-300"
              : "bg-blue-900/30 text-blue-300"
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">•</span>
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
