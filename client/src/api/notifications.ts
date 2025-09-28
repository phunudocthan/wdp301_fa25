import axiosInstance from './axiosInstance';

export interface NotificationItem {
  _id: string;
  userId?: string;
  message: string;
  type: 'order' | 'system' | 'promotion';
  status: 'unread' | 'read';
  createdAt?: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await axiosInstance.get('/notifications');
  return response.data?.notifications || [];
}

export async function createNotification(message: string, type: NotificationItem['type'] = 'system'): Promise<NotificationItem> {
  const response = await axiosInstance.post('/notifications', { message, type });
  return response.data?.notification;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
  return response.data?.notification;
}
