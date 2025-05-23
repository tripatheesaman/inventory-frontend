'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    try {
      markAsRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    // Handle navigation based on referenceType
    switch (notification.referenceType) {
      case 'request':
        router.push(`/request/${notification.referenceNumber}?notificationId=${notification.id}`);
        break;
      case 'issue':
        router.push(`/issue/${notification.referenceNumber}?notificationId=${notification.id}`);
        break;
      case 'receive':
        router.push(`/receive/${notification.referenceNumber}?notificationId=${notification.id}`);
        break;
      case 'rrp':
        router.push(`/rrp/${notification.referenceNumber}?notificationId=${notification.id}`);
        break;
      default:
        break;
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative hover:bg-[#003594]/5 transition-colors",
          isOpen && "bg-[#003594]/5"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-[#003594]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#d2293b] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-[#002a6e]/10">
          <div className="p-4 border-b border-[#002a6e]/10 flex justify-between items-center">
            <h3 className="font-semibold text-[#003594]">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#003594] hover:bg-[#003594]/5 hover:text-[#003594]"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
          
          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-[#003594]/5 cursor-pointer transition-colors border-b border-[#002a6e]/10 last:border-b-0",
                    notification.isRead === 0 && "bg-[#003594]/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    {notification.isRead === 0 && (
                      <Check className="h-4 w-4 text-[#003594] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 