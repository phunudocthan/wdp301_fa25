import axiosInstance from './axiosInstance';

export interface NotificationItem {
  _id: string;
  userId?: string;
  title: string;
  message: string;
  category: 'promotion' | 'order' | 'product' | 'system' | 'engagement';
  type: 'order' | 'system' | 'promotion' | 'product' | 'engagement';
  link?: string;
  image?: string;
  meta?: any;
  status: 'unread' | 'read';
  createdAt?: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await axiosInstance.get('/notifications');
  return response.data?.notifications || [];
}

export async function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
  return response.data?.notification;
}

export async function fetchNotificationDetail(notificationId: string): Promise<NotificationItem> {
  const response = await axiosInstance.get(`/notifications/${notificationId}`);
  return response.data?.notification;
}
