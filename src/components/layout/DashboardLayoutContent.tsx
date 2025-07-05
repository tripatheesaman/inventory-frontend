'use client';

import { lazy, Suspense } from 'react';
import TopBar from '@/components/layout/Topbar';
import ProtectedRoute from '@/lib/ProtectedRoute';
import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { getRouteConfig } from '@/config/routes';
import { ContentSpinner } from '@/components/ui/spinner';

interface DashboardLayoutContentProps {
  children: ReactNode;
}

const Sidebar = lazy(() => import('@/components/layout/Sidebar'));

export default function DashboardLayoutContent({ children }: DashboardLayoutContentProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname);

  useEffect(() => {
    // Simulate a minimum loading time to prevent flickering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!routeConfig || !routeConfig.requiresAuth) {
    return children;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Suspense fallback={<ContentSpinner />}>
          <Sidebar collapsed={collapsed} />
        </Suspense>
        <div className="flex-1 flex flex-col">
          <TopBar onToggleSidebar={() => setCollapsed(prev => !prev)} />
          <main className="p-6 overflow-y-auto">
            {isLoading ? <ContentSpinner /> : children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 