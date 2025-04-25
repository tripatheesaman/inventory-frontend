'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/Topbar';
import ProtectedRoute from '@/lib/ProtectedRoute';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { getRouteConfig } from '@/config/routes';
import { ContentSpinner } from '@/components/ui/spinner';

interface DashboardLayoutContentProps {
  children: ReactNode;
}

export default function DashboardLayoutContent({ children }: DashboardLayoutContentProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname);

  if (!routeConfig || !routeConfig.requiresAuth) {
    return children;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <div className="flex-1 flex flex-col">
          <TopBar onToggleSidebar={() => setCollapsed(prev => !prev)} />
          <main className="p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 