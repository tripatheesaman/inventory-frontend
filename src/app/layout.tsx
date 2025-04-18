/*
File: src/app/layout.tsx
Purpose: Root layout that handles both authenticated and unauthenticated routes
*/

'use client'

import { useAuthContext, AuthContextProvider } from '@/context/AuthContext/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/Topbar';
import ProtectedRoute from '@/lib/ProtectedRoute';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import '@/styles/globals.css';

interface LayoutProps {
  children: ReactNode;
}

function DashboardLayoutContent({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Check if the current route requires authentication
  const isAuthRoute = !pathname.startsWith('/login');

  if (!isAuthRoute) {
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

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthContextProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </AuthContextProvider>
      </body>
    </html>
  );
}
