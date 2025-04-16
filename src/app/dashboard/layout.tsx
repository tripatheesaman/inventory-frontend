// app/dashboard/layout.tsx
'use client'

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext/AuthContext';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Unauthorized from '@/components/Unauthorized';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, permissions } = useAuthContext();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const routePermissions: { [key: string]: string } = {
    '/dashboard': 'can_view_home',
    '/dashboard/search': 'can_search',
    '/dashboard/issue': 'can_issue',
    '/dashboard/receive': 'can_receive',
    '/dashboard/reports': 'can_view_reports',
  };

  const requiredPermission = routePermissions[pathname] ?? '';

  if (!isAuthenticated) return null; // Can be replaced by loading spinner

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <Unauthorized />;
  }

  return (
    <div className="flex min-h-screen pt-16">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} permissions={permissions} />
      <main className="flex-1 ml-16 md:ml-64 p-4">
        <Topbar />
        {children}
      </main>
    </div>
  );
};

export default Layout;