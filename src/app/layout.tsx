/*
File: src/app/layout.tsx
Purpose: Root layout that handles both authenticated and unauthenticated routes
*/

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import DashboardLayoutContent from '@/components/layout/DashboardLayoutContent';
import { AuthContextProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from '@/context/NotificationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GIMS',
  description: 'Inventory Management System',
  icons: {
    icon: '/images/nac_icon.png',
  },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthContextProvider>
          <NotificationProvider>
            <DashboardLayoutContent>
              {children}
            </DashboardLayoutContent>
          </NotificationProvider>
        </AuthContextProvider>
        <Toaster />
      </body>
    </html>
  );
}
