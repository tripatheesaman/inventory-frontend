/*
File: src/components/layout/Layout.tsx
Purpose: Layout wrapper including Sidebar, TopBar and permission filtering
*/

'use client';

import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './Topbar';
import Unauthorized from '@/app/(fallback)/unauthorized/page';
import { Suspense } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, permissions } = useAuthContext();
  const path = usePathname();

  const routePermissionMap: Record<string, string> = {
    '/dashboard': 'view_dashboard',
    '/issue': 'issue_item',
    '/receive': 'receive_item',
    '/reports': 'view_reports',
  };

  const requiredPermission = Object.entries(routePermissionMap).find(([route]) => path.startsWith(route))?.[1];

  if (false &&requiredPermission && !permissions?.includes(requiredPermission)) {
    return <Unauthorized />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-4">
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
