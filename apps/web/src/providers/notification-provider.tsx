'use client';

import { useJobNotifications } from '@/hooks/use-job-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useJobNotifications();
  return <>{children}</>;
}